#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HX711.h>
#include <ESP32Servo.h>


const uint8_t PIN_SDA      = 21;
const uint8_t PIN_SCL      = 22;
const uint8_t PIN_DS18B20  = 4;
const uint8_t PIN_HX_DOUT  = 16;
const uint8_t PIN_HX_SCK   = 17;
const uint8_t PIN_LEVEL    = 34;   // analog, input only
const uint8_t PIN_TDS      = 35;   // analog, input only
const uint8_t PIN_SERVO    = 18;
const uint8_t PIN_V1       = 19;   // fill valve
const uint8_t PIN_V2       = 23;   // recirculation valve
const uint8_t PIN_V3       = 27;   // dispense valve
const uint8_t PIN_V4       = 14;   // drain valve
const uint8_t PIN_R385     = 26;   // fill pump
const uint8_t PIN_PERI     = 25;   // peristaltic pump
const uint8_t PIN_SSR      = 13;   // heater SSR control input
const uint8_t PIN_START    = 32;   // button to GND (internal pull-up)
const uint8_t PIN_STOP     = 33;   // button to GND (internal pull-up)


const float CAL_FACTOR = 225.0f;

// Safety limits
const float    MAX_TEMP_C        = 105.0f;   // hard cutoff, heater off + ERROR
const float    MIN_HEAT_MASS_G   = 60.0f;    // heater refuses to run below this
const uint32_t TEMP_STALE_MS     = 5000;
const uint32_t MASS_STALE_MS     = 3000;

// Stage limits
const float    FILL_COAST_G      = 20.0f;    // stop early, pump keeps moving water
const uint32_t FILL_TIMEOUT_MS   = 120000;
const float    NO_FLOW_MIN_G     = 10.0f;    // must see at least this much...
const uint32_t NO_FLOW_CHECK_MS  = 20000;    // ...within this time
const uint32_t HEAT_TIMEOUT_MS   = 30UL * 60000UL;
const uint32_t SETTLE_MS         = 30000;
const uint32_t DISPENSE_MIN_MS   = 10000;
const uint32_t DISPENSE_TIMEOUT_MS = 180000;
const uint32_t EJECT_HOLD_MS     = 2500;
const uint32_t CLEAN_MIN_MS      = 15000;
const uint32_t CLEAN_TIMEOUT_MS  = 120000;
const float    MASS_SETTLED_G    = 2.0f;     // "no longer changing" threshold

// Feature switches
const bool ENABLE_REDUCTION  = true;         // evaporate down to recipe.finalG
const bool USE_TDS           = true;         // false -> fixed recirculation time
const uint32_t FIXED_RECIRC_MS = 5UL * 60000UL;
const bool USE_LEVEL_SENSOR  = false;        // overflow guard, needs calibration
const int  LEVEL_OVERFLOW_RAW = 3000;

// TDS (proxy for dissolved solids; NOT a measure of specific compounds)
const uint32_t TDS_SAMPLE_MS = 10000;
const int      TDS_WIN       = 12;           // samples compared across (12 x 10 s = 2 min)
const float    TDS_MIN_VALID_PPM = 50.0f;    // below this the probe is treated as invalid

// The dry pod is inside the chamber when the scale is tared, so water the pod
// absorbs is counted as liquid. Estimate (grams) to add to the final target.
const float POD_WATER_G = 0.0f;

// Servo (pod release)
const int SERVO_HOME  = 0;
const int SERVO_EJECT = 90;

// ======================= Recipe (PLACEHOLDER values) =======================
struct Recipe {
  const char* name;
  float    waterG;          // fill target (1 ml ~ 1 g)
  float    finalG;          // reduction target
  uint32_t soakMs;
  float    extractLowC, extractHighC;   // heater hysteresis during extraction
  float    reduceLowC,  reduceHighC;    // heater hysteresis during reduction
  uint32_t minRecircMs, maxRecircMs;
  float    tdsPlateauPpm;   // extraction done when TDS changes less than this per window
  uint32_t maxReduceMs;
};

const Recipe RECIPE = {
  "Dashamula",
  400.0f, 100.0f,
  10UL * 60000UL,
  85.0f, 90.0f,
  96.0f, 99.0f,
  3UL * 60000UL, 30UL * 60000UL,
  5.0f,
  90UL * 60000UL
};

// ======================= State machine =======================
enum State {
  ST_IDLE, ST_FILLING, ST_SOAKING, ST_HEATING, ST_RECIRC, ST_REDUCING,
  ST_SETTLING, ST_DISPENSING, ST_POD_EJECT, ST_CLEANING, ST_READY, ST_ERROR
};

const char* stateName(State s) {
  switch (s) {
    case ST_IDLE:       return "IDLE";
    case ST_FILLING:    return "FILLING";
    case ST_SOAKING:    return "SOAKING";
    case ST_HEATING:    return "HEATING";
    case ST_RECIRC:     return "RECIRC";
    case ST_REDUCING:   return "REDUCING";
    case ST_SETTLING:   return "SETTLING";
    case ST_DISPENSING: return "DISPENSE";
    case ST_POD_EJECT:  return "POD EJECT";
    case ST_CLEANING:   return "CLEANING";
    case ST_READY:      return "READY";
    default:            return "ERROR";
  }
}

// ======================= Globals =======================
Adafruit_SSD1306 display(128, 64, &Wire, -1);
OneWire oneWire(PIN_DS18B20);
DallasTemperature tempSensor(&oneWire);
HX711 scale;
Servo podServo;

State    state = ST_IDLE;
uint32_t stateStart = 0;
String   errorMsg = "";
String   warnMsg  = "";

float    tempC = 0;
bool     tempValid = false;
uint32_t lastTempOk = 0;
bool     tempRequested = false;
uint32_t tempReqT = 0;

float    mass = 0;
bool     massInit = false;
uint32_t lastMassOk = 0;

float    stableM = 0;
uint32_t stableT = 0;

bool     heaterWanted = false;
bool     heaterOn = false;
float    heatLow = 0, heatHigh = 0;

float    tdsBuf[TDS_WIN];
int      tdsHead = 0, tdsCount = 0;
float    tdsNow = 0;
uint32_t lastTdsSample = 0;

uint32_t lastLog = 0, lastDraw = 0;

struct Btn { uint8_t pin; bool last; uint32_t t; };
Btn btnStart = { PIN_START, false, 0 };
Btn btnStop  = { PIN_STOP,  false, 0 };

// ======================= Output helpers =======================
void setHeater(bool on) { heaterOn = on; digitalWrite(PIN_SSR, on ? HIGH : LOW); }

void outputsOff() {
  digitalWrite(PIN_V1, LOW);  digitalWrite(PIN_R385, LOW);
  digitalWrite(PIN_V2, LOW);  digitalWrite(PIN_PERI, LOW);
  digitalWrite(PIN_V3, LOW);
  digitalWrite(PIN_V4, LOW);
}

void allOff() {
  outputsOff();
  heaterWanted = false;
  setHeater(false);
}

void setFillPath(bool on)   { digitalWrite(PIN_V1, on); digitalWrite(PIN_R385, on); }
void setRecircPath(bool on) { digitalWrite(PIN_V2, on); digitalWrite(PIN_PERI, on); }
void setDispense(bool on)   { digitalWrite(PIN_V3, on); }
void setDrain(bool on)      { digitalWrite(PIN_V4, on); }

void fail(const String& msg) {
  if (state == ST_ERROR) return;
  allOff();
  errorMsg = msg;
  state = ST_ERROR;
  stateStart = millis();
  Serial.println("!!! ERROR: " + msg);
}

void enterState(State s) {
  outputsOff();                       // valves/pumps always start closed; heater handled separately
  state = s;
  stateStart = millis();
  stableM = mass;
  stableT = millis();
  Serial.println(String(">> ") + stateName(s));

  switch (s) {
    case ST_FILLING:    setFillPath(true); break;
    case ST_RECIRC:
      setRecircPath(true);
      tdsHead = 0; tdsCount = 0; lastTdsSample = millis();
      break;
    case ST_DISPENSING: setDispense(true); break;
    case ST_POD_EJECT:  podServo.write(SERVO_EJECT); break;
    case ST_CLEANING:   setDrain(true); break;
    default: break;
  }
}

// ======================= Inputs =======================
bool pressed(Btn& b) {
  bool now = (digitalRead(b.pin) == LOW);
  bool ev = false;
  if (now && !b.last && millis() - b.t > 50) { ev = true; b.t = millis(); }
  b.last = now;
  return ev;
}

void updateSensors() {
  uint32_t now = millis();

  // DS18B20, non-blocking
  if (tempRequested && now - tempReqT >= 800) {
    float t = tempSensor.getTempCByIndex(0);
    tempRequested = false;
    if (t == DEVICE_DISCONNECTED_C || t < -50.0f || t > 125.0f) {
      tempValid = false;
    } else {
      tempC = t; tempValid = true; lastTempOk = now;
    }
  }
  if (!tempRequested && now - tempReqT >= 1000) {
    tempSensor.requestTemperatures();
    tempRequested = true;
    tempReqT = now;
  }

  // HX711
  if (scale.is_ready()) {
    float m = scale.get_units(1);
    mass = massInit ? (0.7f * mass + 0.3f * m) : m;
    massInit = true;
    lastMassOk = now;
  }
}

// TDS in ppm, temperature compensated. Proxy only.
float readTdsPpm() {
  long sum = 0;
  for (int i = 0; i < 30; i++) { sum += analogRead(PIN_TDS); delay(2); }
  float v = (sum / 30.0f) * 3.3f / 4095.0f;
  float t = tempValid ? tempC : 25.0f;
  float vc = v / (1.0f + 0.02f * (t - 25.0f));
  float tds = (133.42f * vc * vc * vc - 255.86f * vc * vc + 857.39f * vc) * 0.5f;
  return tds < 0 ? 0 : tds;
}

bool massSettled(uint32_t minMs) {
  if (millis() - stateStart < minMs) return false;
  if (millis() - stableT >= 5000) {
    bool ok = fabsf(mass - stableM) < MASS_SETTLED_G;
    stableM = mass; stableT = millis();
    return ok;
  }
  return false;
}

// ======================= Heater (hysteresis) =======================
void setHeatBand(float low, float high) { heatLow = low; heatHigh = high; heaterWanted = true; }

void heaterUpdate() {
  if (!heaterWanted || !tempValid) { setHeater(false); return; }
  if (tempC <= heatLow)       setHeater(true);
  else if (tempC >= heatHigh) setHeater(false);
}

// ======================= Safety =======================
const char* checkSafety() {
  uint32_t now = millis();
  if (tempValid && tempC > MAX_TEMP_C) return "Over-temperature";
  if ((heaterWanted || heaterOn) && (!tempValid || now - lastTempOk > TEMP_STALE_MS))
    return "Temp sensor fault";
  if ((heaterWanted || heaterOn) && mass < MIN_HEAT_MASS_G)
    return "Too little liquid";
  bool active = (state != ST_IDLE && state != ST_READY && state != ST_ERROR);
  if (active && (!massInit || now - lastMassOk > MASS_STALE_MS))
    return "Load cell lost";
  if (USE_LEVEL_SENSOR && state == ST_FILLING && analogRead(PIN_LEVEL) >= LEVEL_OVERFLOW_RAW)
    return "Overflow level";
  return nullptr;
}

// ======================= Display / logging =======================
void drawStatus() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("iKWATH "); display.println(stateName(state));
  display.println(RECIPE.name);
  display.print("Temp ");
  if (tempValid) display.print(tempC, 1); else display.print("--");
  display.print("C Heat:"); display.println(heaterOn ? "ON" : "off");
  display.print("Mass "); display.print(mass, 0); display.println(" g");

  switch (state) {
    case ST_IDLE:    display.println("Pod in, tank full"); display.println("Press START"); break;
    case ST_FILLING: display.print("Target "); display.print(RECIPE.waterG, 0); display.println(" g"); break;
    case ST_SOAKING: display.print("Soak left "); display.print((RECIPE.soakMs - (millis() - stateStart)) / 1000); display.println("s"); break;
    case ST_RECIRC:  display.print("TDS "); display.print(tdsNow, 0); display.println(" ppm"); break;
    case ST_REDUCING:display.print("Target "); display.print(RECIPE.finalG + POD_WATER_G, 0); display.println(" g"); break;
    case ST_READY:   display.println("KWATH READY"); display.println(warnMsg.length() ? warnMsg : String("START = new cycle")); break;
    case ST_ERROR:   display.println(errorMsg); display.println("START = reset"); break;
    default: break;
  }
  display.display();
}

void logStatus() {
  Serial.print("["); Serial.print(stateName(state)); Serial.print("] T=");
  Serial.print(tempValid ? String(tempC, 1) : String("--"));
  Serial.print("C M="); Serial.print(mass, 0);
  Serial.print("g TDS="); Serial.print(tdsNow, 0);
  Serial.print(" H="); Serial.println(heaterOn ? "ON" : "off");
}

// ======================= Stage logic =======================
void runState(bool startEv) {
  uint32_t el = millis() - stateStart;

  switch (state) {

    case ST_IDLE:
      heaterWanted = false;
      if (startEv) {
        if (!massInit || !tempValid) { fail("Sensor not ready"); break; }
        warnMsg = "";
        scale.tare(10);               // chamber (with dry pod) must be empty of liquid
        mass = 0;
        enterState(ST_FILLING);
      }
      break;

    case ST_FILLING:
      if (mass >= RECIPE.waterG - FILL_COAST_G) { enterState(ST_SOAKING); break; }
      if (el > NO_FLOW_CHECK_MS && mass < NO_FLOW_MIN_G) { fail("No water flow"); break; }
      if (el > FILL_TIMEOUT_MS) { fail("Fill timeout"); break; }
      break;

    case ST_SOAKING:
      if (el >= RECIPE.soakMs) { enterState(ST_HEATING); }
      break;

    case ST_HEATING:
      setHeatBand(RECIPE.extractLowC, RECIPE.extractHighC);
      if (tempValid && tempC >= RECIPE.extractLowC) { enterState(ST_RECIRC); break; }
      if (el > HEAT_TIMEOUT_MS) { fail("Heat-up timeout"); break; }
      break;

    case ST_RECIRC: {
      setHeatBand(RECIPE.extractLowC, RECIPE.extractHighC);
      bool done = false;

      if (USE_TDS) {
        if (millis() - lastTdsSample >= TDS_SAMPLE_MS) {
          lastTdsSample = millis();
          tdsNow = readTdsPpm();
          bool full = (tdsCount >= TDS_WIN);
          float oldest = full ? tdsBuf[tdsHead] : 0;
          tdsBuf[tdsHead] = tdsNow;
          tdsHead = (tdsHead + 1) % TDS_WIN;
          if (tdsCount < TDS_WIN) tdsCount++;
          if (full && el >= RECIPE.minRecircMs && tdsNow >= TDS_MIN_VALID_PPM &&
              fabsf(tdsNow - oldest) < RECIPE.tdsPlateauPpm) {
            done = true;
            Serial.println("Extraction plateau reached");
          }
        }
        if (!done && el >= RECIPE.maxRecircMs) {
          done = true;
          warnMsg = "TDS plateau not seen";
          Serial.println("WARN: recirculation timeout, TDS plateau not confirmed");
        }
      } else {
        done = (el >= FIXED_RECIRC_MS);
      }

      if (done) enterState(ENABLE_REDUCTION ? ST_REDUCING : ST_SETTLING);
      break;
    }

    case ST_REDUCING:
      setHeatBand(RECIPE.reduceLowC, RECIPE.reduceHighC);
      if (mass <= RECIPE.finalG + POD_WATER_G) { heaterWanted = false; enterState(ST_SETTLING); break; }
      if (el >= RECIPE.maxReduceMs) {
        warnMsg = "Reduce target not hit";
        heaterWanted = false;
        enterState(ST_SETTLING);
      }
      break;

    case ST_SETTLING:
      heaterWanted = false;
      if (el >= SETTLE_MS) enterState(ST_DISPENSING);
      break;

    case ST_DISPENSING:
      if (massSettled(DISPENSE_MIN_MS)) { enterState(ST_POD_EJECT); break; }
      if (el >= DISPENSE_TIMEOUT_MS) { warnMsg = "Dispense timeout"; enterState(ST_POD_EJECT); }
      break;

    case ST_POD_EJECT:
      if (el >= EJECT_HOLD_MS) { podServo.write(SERVO_HOME); enterState(ST_CLEANING); }
      break;

    case ST_CLEANING:
      if (massSettled(CLEAN_MIN_MS)) { enterState(ST_READY); break; }
      if (el >= CLEAN_TIMEOUT_MS) { warnMsg = "Drain timeout"; enterState(ST_READY); }
      break;

    case ST_READY:
      heaterWanted = false;
      if (startEv) enterState(ST_IDLE);
      break;

    case ST_ERROR:
      allOff();
      if (startEv) { errorMsg = ""; enterState(ST_IDLE); }
      break;
  }
}

// ======================= Arduino entry points =======================
void setup() {
  // Outputs first, so nothing is energised during boot
  const uint8_t outs[] = { PIN_V1, PIN_V2, PIN_V3, PIN_V4, PIN_R385, PIN_PERI, PIN_SSR };
  for (uint8_t p : outs) { pinMode(p, OUTPUT); digitalWrite(p, LOW); }
  pinMode(PIN_START, INPUT_PULLUP);
  pinMode(PIN_STOP,  INPUT_PULLUP);

  Serial.begin(115200);
  Wire.begin(PIN_SDA, PIN_SCL);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay(); display.display();

  podServo.setPeriodHertz(50);
  podServo.attach(PIN_SERVO, 500, 2400);
  podServo.write(SERVO_HOME);

  tempSensor.begin();
  tempSensor.setWaitForConversion(false);
  tempSensor.requestTemperatures();
  tempRequested = true;
  tempReqT = millis();

  scale.begin(PIN_HX_DOUT, PIN_HX_SCK);
  scale.set_scale(CAL_FACTOR);

  analogReadResolution(12);

  if (!scale.wait_ready_timeout(2000)) {
    fail("HX711 not found");
  } else {
    scale.tare(10);
    enterState(ST_IDLE);
  }
  Serial.println("iKwath ready");
}

void loop() {
  updateSensors();

  bool startEv = pressed(btnStart);
  bool stopEv  = pressed(btnStop);

  if (stopEv) fail("STOP pressed");

  const char* f = checkSafety();
  if (f) fail(f);

  runState(startEv);
  heaterUpdate();

  if (millis() - lastDraw > 250)  { lastDraw = millis(); drawStatus(); }
  if (millis() - lastLog  > 2000) { lastLog  = millis(); logStatus(); }
}
