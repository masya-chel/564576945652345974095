export type VoutInputMode = 'voltage' | 'resistors';
export type SoftStartInputMode = 'time' | 'capacitor';
export type UvloInputMode = 'voltage' | 'resistors';
export type FswInputMode = 'frequency' | 'resistor';
export type ModeInputMode = 'mode' | 'resistor';
export type CompInputMode = 'auto' | 'manual';
export type VsnsInputMode = 'auto' | 'manual';
export type BootInputMode = 'standard' | 'custom';
export type ChipModel = 'SiC461' | 'SiC462' | 'SiC463' | 'SiC464';
export type OperatingMode = 1 | 2 | 3 | 4;

export interface CalculatorInputs {
  chipModel: ChipModel; // SiC461 (10A), SiC462 (6A), SiC463 (4A), SiC464 (2A)
  operatingMode: OperatingMode; // 1: PSM + int VDRV, 2: FCCM + int VDRV, 3: FCCM + ext VDRV, 4: PSM + ext VDRV
  ultrasonicEnabled: boolean;

  vinNom: number;       // Nominal input voltage (V)
  vinMin: number;       // Minimum input voltage (V)
  vinMax: number;       // Maximum input voltage (V)
  vout: number;         // Desired output voltage (V)
  ioutMax: number;      // Maximum continuous output current (A)
  fswKhz: number;       // Switching frequency (kHz)
  kind: number;         // Inductor ripple current ratio (typically 0.2 to 0.4, default 0.3)
  voutRippleMaxMv: number; // Maximum allowed output voltage ripple (mV)
  loadStepA: number;    // Transient load step for Cout design (A)
  voltageOvershootMv: number; // Max allowed overshoot/undershoot during load step (mV)
  tssMs: number;        // Soft-start time (ms)
  vinStartUvlo: number; // Custom UVLO rising threshold on VIN (V)
  vinStopUvlo?: number; // Custom UVLO falling threshold on VIN (V)

  // Mode flags defining how each parameter is specified (bidirectional / manual flags)
  voutInputMode: VoutInputMode;
  softStartInputMode: SoftStartInputMode;
  uvloInputMode: UvloInputMode;
  fswInputMode: FswInputMode;
  modeInputMode: ModeInputMode;
  compInputMode: CompInputMode;
  vsnsInputMode: VsnsInputMode;
  bootInputMode: BootInputMode;

  // Component values participating in the input definitions
  rfb1Kohm: number;     // Top feedback resistor (kΩ) - R_FB_H
  rfb2Kohm: number;     // Bottom feedback resistor (kΩ) - R_FB_L
  cssNf: number;        // Soft-start capacitor (nF) - Css
  ren1Kohm: number;     // Top UVLO divider resistor (kΩ) - R_EN_H
  ren2Kohm: number;     // Bottom UVLO divider resistor (kΩ) - R_EN_L
  rfswKohm: number;     // Frequency setting resistor (kΩ) - R_fsw
  rmodeKohm: number;    // Operating mode resistor (kΩ) - R_mode
  rcompKohm: number;    // Loop compensation resistor (kΩ) - R_comp
  ccompPf: number;      // Loop compensation capacitor (pF) - C_comp
  rxKohm: number;       // Ripple injection resistor (kΩ) - Rx
  cxNf: number;         // Ripple injection capacitor (nF) - Cx
  cyNf: number;         // Ripple injection filter capacitor (nF) - Cy
  rbootOhm: number;     // Bootstrap resistor between BOOT and PHASE (Ω) - R_boot
  cbootNf: number;      // Bootstrap capacitor (nF) - C_boot
  cvdrvUf: number;      // VDRV decoupling capacitor (µF) - C_vdrv
  vdrvExtVoltage: number; // External VDRV supply voltage (V) if Mode 3 or 4
  rvcinOhm: number;     // VCIN filter resistor (Ω)
  cvcinUf: number;      // VCIN capacitor (µF)
  cvddUf: number;       // VDD capacitor (µF)
  rpgoodKohm: number;   // PGOOD pull-up resistor (kΩ)
}

export interface StandardComponent {
  theoretical: number;
  nominal: number;
  unit: string;
  formatted: string;
  series: 'E12' | 'E24' | 'E96';
  errorPercent: number;
  packageRecommendation?: string;
  voltageRating?: string;
  currentRating?: string;
}

export interface CalculatorResults {
  chipModel: ChipModel;
  maxRatedCurrentA: number;

  // Duty cycle
  dutyNom: number;
  dutyMin: number;
  dutyMax: number;
  
  // Timing
  tonNs: number;
  toffNs: number;
  tonMinWarning: boolean;
  toffMinWarning: boolean;

  // Inductor (Pins 7-10 SW to VOUT)
  deltaIL: number;
  lCalcUh: number;
  lNominal: StandardComponent;
  actualDeltaIL: number;
  actualKind: number;
  iPeak: number;
  iValley: number;
  iRms: number;

  // Output Capacitor
  coutRippleMinUf: number;
  coutTransientMinUf: number;
  coutEffectiveMinUf: number;
  coutRecommendedUf: StandardComponent;
  coutQty: number;
  coutSingleUf: number;
  actualRippleMv: number;

  // Input Capacitor (Pins 11-15 PGND to VIN)
  cinRmsA: number;
  cinMinUf: number;
  cinRecommendedUf: StandardComponent;
  cinQty: number;
  cinSingleUf: number;

  // Feedback Divider (VFB Pin 22)
  vref: number; // 0.8V
  rfbBottom: StandardComponent; // R_FB_L typically 10.0k
  rfbTop: StandardComponent;    // R_FB_H
  voutActual: number;
  voutErrorPercent: number;
  cffPf?: StandardComponent;

  // Switching Frequency Resistor (fSW Pin 24)
  rfswKohm: StandardComponent;  // R_fsw = Vout / (fsw * 1.9e-10)
  actualFswKhz: number;

  // Operation Mode Resistor (MODE Pin 27)
  rmodeKohm: StandardComponent; // Rmode (2k, 301k, 499k, 1000k)
  modeDescription: string;
  detectedMode: OperatingMode;

  // Ripple Injection Network (VSNS Pin 20 & SW & VOUT)
  rxKohm: StandardComponent;    // Rx
  cxNf: StandardComponent;      // Cx
  cyNf: StandardComponent;      // Cy
  vrampMv: number;              // Calculated ripple amplitude (100 - 900 mV)
  vrampMinMv: number;
  vrampWarning: boolean;

  // Loop Error Amplifier Compensation (COMP Pin 21)
  rcompKohm: StandardComponent; // Rcomp
  ccompPf: StandardComponent;   // Ccomp
  crossoverFreqKhz: number;
  lcPoleFreqKhz: number;

  // Soft-start (SS Pin 19)
  cssNf: StandardComponent;
  actualTssMs: number;

  // Current limit (ILIMIT Pin 25)
  klimValue: number;            // 780K for 461, 480K for 462, 240K for 463/464
  rlimKohm: StandardComponent;  // Rlim = Klim / Ivalley
  ilimNominalA: number;

  // UVLO EN Divider (EN Pin 3)
  renTopKohm: StandardComponent;
  renBottomKohm: StandardComponent;
  actualVinStart: number;
  actualVinStop: number;

  // Bootstrap & Phase Network (BOOT Pin 4 & PHASE1, PHASE2 Pins 5, 6)
  cbootNf: StandardComponent;   // 0.1 µF (100 nF) on BOOT (Pin 4)
  rbootOhm: StandardComponent;  // 3.3 Ω on BOOT to PHASE1/2 (Pins 5, 6)

  // Gate Drive & Bias Components (VDRV Pin 16 & VDD Pin 26 & VCIN Pin 1)
  cvdrvUf: StandardComponent;   // 4.7 µF on VDRV (Pin 16)
  vdrvSupplySource: string;     // Internal LDO vs External 5V
  vdrvPowerLossW: number;       // Power dissipated in internal VDRV regulator
  cvcinUf: StandardComponent;   // 0.1 µF on VCIN (Pin 1)
  rvcinOhm: StandardComponent;  // 0 Ω / 2.2 Ω on VCIN (Pin 1)
  cddUf: StandardComponent;     // 1.0 µF on VDD (Pin 26)
  rpgoodKohm: StandardComponent;// 102 kΩ on PGOOD (Pin 2)
  ruSonicOhm: StandardComponent;// 0 Ω on ULTRASONIC (Pin 18) to VDD

  // Efficiency & Power dissipation estimates
  estimatedEfficiency: number;
  estimatedPowerLossW: number;
  conductionLossW: number;
  switchingLossW: number;
  inductorDcrLossW: number;

  // Validation warnings
  warnings: string[];
}

export interface BomItem {
  id: string;
  designator: string;
  pinNumber: string;
  description: string;
  category: 'IC' | 'Inductor' | 'Capacitor' | 'Resistor';
  nominalValue: string;
  calculatedValue: string;
  tolerance: string;
  minRating: string;
  recommendedFootprint: string;
  notes: string;
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  inputs: CalculatorInputs;
}
