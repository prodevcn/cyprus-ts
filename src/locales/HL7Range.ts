export default {
  //hematology
  WBC: [2.5, 30, 'inclusive'],
  RBC: [2, 10, 'exclusive'],
  HGB: [8, 20, 'inclusive'],
  HCT: [18, 55, 'percent'],
  MCH: [20, 40, 'exclusive'],
  MCHC: [20, 50, 'exclusive'],
  MCV: [50, 120, 'exclusive'],
  PLT: [60, 800, 'inclusive'],
  //others
  WBCT: [2.5, 30, 'inclusive'],
  PLATELETS: [60, 800, 'inclusive'],
  PLATELET: [60, 800, 'inclusive'],
  RDW: [5, 40, 'exclusive'],
  MPV: [3.0, 20, 'exclusive'],
  //biochemistry

  ALP: [null, 500, 'incRight'],
  'γ-GT': [null, 250, 'incRight'],
  'Γ-GT': [null, 250, 'incRight'],
  UA: [null, 12.0, 'incRight'],
  CRE: [null, 3, 'incRight'],
  UREA: [null, 100, 'incRight'],
  CHOL: [null, 400, 'incRight'],
  TRIGL: [null, 500, 'incRight'],
  AMYL: [null, 200, 'incRight'],
  GLUC: [50, 400, 'incLeft'],
  TP: [null, 14, 'incRight'],
  MG: [1.0, 9.0, 'inclusive'],
  'BIL-D': [null, 3.0, 'incRight'],
  CA: [6.5, 13.0, 'inclusive'],
  PHOS: [1.0, null, 'incLeft'],
  CK: [null, 1000, 'incRight'],
  FE: [5.0, 250, 'incLeft'],
  LDH: [null, 1500, 'incRight'],
  //others
  BILTS: [null, 15.0, 'incRight'], //age
  P4: [1.0, 1000, 'incLeft'],
  SGOT: [null, 250, 'incRight'],
  SGPT: [null, 250, 'incRight'],

  //WI-10
  ALP1: [null, 500, 'incRight'],
  CK1: [null, 1000, 'incRight'], //Total
  P: [1.0, null, 'incLeft'],
  'γ - GT': [null, 250, 'incRight'],
  'Γ - GT': [null, 250, 'incRight'],
  PLTCT: [60, 800, 'inclusive'],
  GGT: [null, 250, 'incRight'],
}
