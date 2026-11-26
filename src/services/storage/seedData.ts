import { SERVICE_CATALOG } from '../../data/serviceCatalog';
import { hashPassword } from './cryptoAuth';
import { DEFAULT_TIER_RULES } from './trustAndTiers';
import {
  AssessmentItemRecord,
  AssessmentRequestRecord,
  AssessmentScoreRecord,
  AssessorProfileRecord,
  AuditLogRecord,
  BadgeRecord,
  CompetencyRecord,
  EarningsLogRecord,
  EmployerProfileRecord,
  EvidenceRecord,
  InternalDatabaseSchema,
  JobRecord,
  NotificationRecord,
  ReviewRecord,
  RubricCriterionRecord,
  TierApplicationRecord,
  TradeRecord,
  UserRecord,
  WorkerProfileRecord,
} from './types';

export interface SeedCompetencyDef {
  id: string;
  slug: string;
  title: string;
  urduTitle: string;
  description: string;
  orderIndex: number;
  criteria: {
    id: string;
    title: string;
    description: string;
    isSafetyCritical: boolean;
    maxScore: number;
    orderIndex: number;
  }[];
}

export interface SeedTradeDef {
  id: string;
  slug: string;
  name: string;
  urduName: string;
  description: string;
  icon: string;
  competencies: SeedCompetencyDef[];
}

// Preserved 3 original trades + rich detailed competencies for Plumber, AC Technician, Painter & Polish, Beauty Parlour at Home
export const DETAILED_TRADES: SeedTradeDef[] = [
  {
    id: 'trade_electrician',
    slug: 'electrician',
    name: 'Electrician',
    urduName: 'الیکٹریشن',
    description: 'Residential and light commercial electrical wiring, distribution board setup, safety earthing, and circuit diagnostics.',
    icon: 'zap',
    competencies: [
      {
        id: 'comp_elec_wiring',
        slug: 'basic-electrical-wiring',
        title: 'Basic Electrical Wiring',
        urduTitle: 'بنیادی برقی وائرنگ',
        description: 'Demonstrate neat conduit routing, color-coded phase/neutral/earth cable pulls, and secure socket & switch wiring.',
        orderIndex: 1,
        criteria: [
          { id: 'crit_ew_1', title: 'Conductor Color & Gauge Selection', description: 'Selects appropriate copper gauge and phase/neutral/earth color coding.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ew_2', title: 'Termination Tightness & Insulation', description: 'Clean stripping without nicked copper; secure terminal screws with zero exposed conductor.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ew_3', title: 'Conduit Alignment & Workmanship', description: 'Straight PVC/metal conduit runs with proper saddles and junction box covers.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
          { id: 'crit_ew_4', title: 'Isolation & Continuity Testing', description: 'Verifies power isolation and continuity before energizing the circuit.', isSafetyCritical: true, maxScore: 3, orderIndex: 4 },
        ],
      },
      {
        id: 'comp_elec_install',
        slug: 'electrical-installation',
        title: 'Electrical Installation',
        urduTitle: 'الیکٹریکل انسٹالیشن',
        description: 'Install distribution boards, MCB/RCCB breakers, lighting fixtures, and load-balanced sub-circuits.',
        orderIndex: 2,
        criteria: [
          { id: 'crit_ei_1', title: 'Breaker Sizing & Load Grouping', description: 'Matches MCB ratings accurately to lighting and power circuits.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ei_2', title: 'Earthing & RCCB Protection', description: 'Proper earth bar bonding and residual-current protection verification.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ei_3', title: 'Panel Labeling & Neat Dressing', description: 'Labeled breakers and organized busbar/neutral links.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_elec_connections',
        slug: 'wiring-connections',
        title: 'Wiring Connections',
        urduTitle: 'وائرنگ کنکشنز',
        description: 'Execute two-way switching, junction box splicing, and motor/pump starter connections cleanly.',
        orderIndex: 3,
        criteria: [
          { id: 'crit_ec_1', title: 'Circuit Logic & Polarity', description: 'Correct live/neutral polarity across switches and outlets.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ec_2', title: 'Connector & Block Integrity', description: 'Uses rated terminal blocks/connectors instead of loose twisted tape joints.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ec_3', title: 'Functional Operation Verification', description: 'Demonstrates full load operation without flicker or overheating.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_elec_safety',
        slug: 'electrical-safety-practices',
        title: 'Electrical Safety Practices',
        urduTitle: 'برقی حفاظتی تدابیر',
        description: 'Apply Lockout/Tagout (LOTO), insulated PPE usage, voltage testing, and safe earth resistance checks.',
        orderIndex: 4,
        criteria: [
          { id: 'crit_es_1', title: 'PPE & Insulated Tool Usage', description: 'Uses insulated gloves, safety glasses, and VDE-rated screwdrivers/pliers.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_es_2', title: 'Zero-Energy Verification', description: 'Tests for dead circuit with multimeter/tester prior to touching conductors.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_es_3', title: 'Hazard Identification & Workspace Order', description: 'Keeps work zone dry, clear of trip hazards, and properly tagged.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_elec_troubleshoot',
        slug: 'circuit-troubleshooting',
        title: 'Circuit Troubleshooting',
        urduTitle: 'سرکٹ فالٹ ٹریسنگ',
        description: 'Diagnose short circuits, open neutrals, earth leakage trips, and voltage drops using a digital multimeter.',
        orderIndex: 5,
        criteria: [
          { id: 'crit_et_1', title: 'Systematic Fault Isolation', description: 'Isolates branch circuits logically to pinpoint the fault.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_et_2', title: 'Multimeter Accuracy & Safety', description: 'Selects correct meter range and probes safely without arc risk.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_et_3', title: 'Root Cause Resolution', description: 'Repairs underlying cause and confirms stable reading post-fix.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_elec_maint',
        slug: 'basic-maintenance',
        title: 'Basic Maintenance',
        urduTitle: 'بنیادی مرمت و دیکھ بھال',
        description: 'Perform preventive inspection of panels, UPS/inverter changeover connections, and thermal hotspot checks.',
        orderIndex: 6,
        criteria: [
          { id: 'crit_em_1', title: 'Preventive Inspection Checklist', description: 'Checks loose lugs, discoloration, and breaker trip action.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_em_2', title: 'Safe Re-Torque & Cleaning', description: 'Performs de-energized cleaning and terminal tightening safely.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_em_3', title: 'Maintenance Documentation', description: 'Records clear observations and recommended follow-ups.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'trade_carpenter',
    slug: 'carpenter',
    name: 'Carpenter',
    urduName: 'بڑھئی / کارپینٹر',
    description: 'Precision measuring, timber cutting, mortise-and-tenon joinery, furniture assembly, and surface finishing.',
    icon: 'hammer',
    competencies: [
      {
        id: 'comp_carp_measure',
        slug: 'measuring-and-marking',
        title: 'Measuring and Marking',
        urduTitle: 'پیمائش اور نشان لگانا',
        description: 'Transfer accurate dimensions using tape measure, try square, marking gauge, and cutting list tolerances.',
        orderIndex: 1,
        criteria: [
          { id: 'crit_cm_1', title: 'Dimensional Accuracy (±1 mm)', description: 'Consistent layout lines verified against the drawing.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_cm_2', title: 'Squareness & Reference Face', description: 'Marks face side/edge and maintains 90-degree square lines.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_cm_3', title: 'Safe Tool Handling', description: 'Handles sharp marking knives and layout tools safely.', isSafetyCritical: true, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_carp_cut',
        slug: 'cutting-and-shaping-wood',
        title: 'Cutting and Shaping Wood',
        urduTitle: 'لکڑی کی کٹائی اور تراش خراش',
        description: 'Execute straight rip/crosscuts, bevels, and planed edges using hand saws, planes, and power saws safely.',
        orderIndex: 2,
        criteria: [
          { id: 'crit_cc_1', title: 'Cut Straightness & Kerf Control', description: 'Clean cuts following the waste side of the layout line.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_cc_2', title: 'Workpiece Clamping & Guards', description: 'Secures timber firmly with clamps and keeps blade guards engaged.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_cc_3', title: 'Edge Flatness & Planing', description: 'Smooth, splinter-free surfaces ready for assembly.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_carp_assembly',
        slug: 'furniture-assembly',
        title: 'Furniture Assembly',
        urduTitle: 'فرنیچر اسمبلی',
        description: 'Assemble frames, cabinets, hinges, and drawer slides square, plumb, and structurally rigid.',
        orderIndex: 3,
        criteria: [
          { id: 'crit_ca_1', title: 'Diagonal Squareness & Alignment', description: 'Assembled carcass/frame checks equal on diagonals.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ca_2', title: 'Fastener & Hardware Precision', description: 'Pilot holes pre-drilled; concealed hinges and slides operate smoothly.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ca_3', title: 'Structural Stability & Safety', description: 'No wobble, sharp exposed screw tips, or weak joints.', isSafetyCritical: true, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_carp_joinery',
        slug: 'joining-techniques',
        title: 'Joining Techniques',
        urduTitle: 'جوڑ لگانے کی مہارت',
        description: 'Craft tight-fitting mortise & tenon, dowel, or dovetail joints with balanced glue squeeze-out.',
        orderIndex: 4,
        criteria: [
          { id: 'crit_cj_1', title: 'Joint Fit & Shoulder Gap', description: 'Snug hand-press fit with tight, clean joint shoulders.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_cj_2', title: 'Chisel Safety & Control', description: 'Both hands kept behind chisel cutting edge; workpiece clamped.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_cj_3', title: 'Glue Application & Clamping', description: 'Even adhesive coverage and protective cauls during clamping.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_carp_safety',
        slug: 'tool-handling-and-safety',
        title: 'Tool Handling and Safety',
        urduTitle: 'اوزار کا محفوظ استعمال',
        description: 'Demonstrate dust protection, ear/eye PPE, sharp blade maintenance, and safe workshop habits.',
        orderIndex: 5,
        criteria: [
          { id: 'crit_cs_1', title: 'Eye, Ear & Dust PPE', description: 'Wears safety goggles, dust mask, and hearing protection when cutting/sanding.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_cs_2', title: 'Push-Stick & Kickback Prevention', description: 'Maintains safe hand distance and proper stance with power tools.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_cs_3', title: 'Tool Storage & Maintenance', description: 'Keeps blades sharp, cords intact, and bench clear of offcuts.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_carp_finish',
        slug: 'finishing-and-polishing',
        title: 'Finishing and Polishing',
        urduTitle: 'فنشنگ اور پالشنگ',
        description: 'Sand progressively through grits and apply stain, sealer, or lacquer evenly with proper ventilation.',
        orderIndex: 6,
        criteria: [
          { id: 'crit_cf_1', title: 'Progressive Sanding Prep', description: 'Sands along the grain with zero cross-grain scratches or glue blotches.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_cf_2', title: 'Ventilation & Chemical Safety', description: 'Applies finishes in ventilated area using appropriate respirator/gloves.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_cf_3', title: 'Uniform Coat & Gloss Consistency', description: 'Even sheen free of runs, drips, or dust nibs.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'trade_mechanic',
    slug: 'mechanic',
    name: 'Car Mechanic (Doorstep & Workshop)',
    urduName: 'آٹو مکینک (کار مکینک)',
    description: 'Automotive inspection, routine engine servicing, brake inspection, fault diagnostics, and preventive maintenance.',
    icon: 'wrench',
    competencies: [
      {
        id: 'comp_mech_inspect',
        slug: 'basic-vehicle-inspection',
        title: 'Basic Vehicle Inspection',
        urduTitle: 'گاڑی کا بنیادی معائنہ',
        description: 'Conduct a structured multi-point check of fluids, belts, hoses, battery health, tires, and underbody leaks.',
        orderIndex: 1,
        criteria: [
          { id: 'crit_mi_1', title: 'Multi-Point Checklist Coverage', description: 'Checks oil, coolant, brake fluid, belts, tires, and lights systematically.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_mi_2', title: 'Vehicle Jacking & Stand Safety', description: 'Uses wheel chocks and rated jack stands before inspecting underbody.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_mi_3', title: 'Accurate Condition Reporting', description: 'Documents wear measurements and leak sources clearly.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_mech_engine',
        slug: 'engine-maintenance',
        title: 'Engine Maintenance',
        urduTitle: 'انجن کی مرمت و سروس',
        description: 'Perform oil and filter changes, spark plug inspection, air/fuel filter servicing, and torque-spec tightening.',
        orderIndex: 2,
        criteria: [
          { id: 'crit_me_1', title: 'Filter & Oil Specification', description: 'Selects correct viscosity oil and seals filter gasket cleanly.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_me_2', title: 'Torque & Hot-Surface Safety', description: 'Uses calibrated torque wrench on drain plug and allows safe cooldown.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_me_3', title: 'Post-Service Leak & Level Check', description: 'Runs engine and verifies zero leaks and exact dipstick level.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_mech_brakes',
        slug: 'brake-system-inspection',
        title: 'Brake System Inspection',
        urduTitle: 'بریک سسٹم کا معائنہ',
        description: 'Measure brake pad/shoe thickness, inspect rotors/drums, check hydraulic lines, and bleed air safely.',
        orderIndex: 3,
        criteria: [
          { id: 'crit_mb_1', title: 'Pad & Rotor Measurement', description: 'Measures pad thickness and rotor wear against minimum spec.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_mb_2', title: 'Hydraulic Integrity & Lug Torque', description: 'Checks brake lines for leaks and torques wheel lugs to manufacturer spec.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_mb_3', title: 'Pedal Firmness & Test Verification', description: 'Confirms firm brake pedal feel before moving vehicle.', isSafetyCritical: true, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_mech_trouble',
        slug: 'basic-troubleshooting',
        title: 'Basic Troubleshooting',
        urduTitle: 'بنیادی خرابی کی تشخیص',
        description: 'Diagnose no-start conditions, charging system faults, overheating, and OBD-II fault codes.',
        orderIndex: 4,
        criteria: [
          { id: 'crit_mt_1', title: 'Diagnostic Sequence', description: 'Tests battery, starter draw, spark/fuel, or OBD codes methodically.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_mt_2', title: 'Rotating Parts & Exhaust Safety', description: 'Keeps hands/tools clear of belts/fans and ensures bay ventilation.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_mt_3', title: 'Verification of Repair', description: 'Confirms fault resolution with live readings.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_mech_tools',
        slug: 'tool-handling',
        title: 'Tool Handling',
        urduTitle: 'اوزار کا درست استعمال',
        description: 'Select and use sockets, torque wrenches, multimeters, and lifting equipment safely and accurately.',
        orderIndex: 5,
        criteria: [
          { id: 'crit_mth_1', title: 'Proper Tool Selection', description: 'Uses exact metric/SAE socket sizes without rounding fasteners.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_mth_2', title: 'PPE & Lift Safety', description: 'Wears safety glasses, oil-resistant gloves, and observes lift lock pins.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_mth_3', title: 'Calibration & Care', description: 'Zeroes torque wrench after use and stores tools clean.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_mech_preventive',
        slug: 'preventive-maintenance',
        title: 'Preventive Maintenance',
        urduTitle: 'احتیاطی دیکھ بھال',
        description: 'Execute scheduled mileage service intervals, coolant flush checks, tire rotation, and battery terminal care.',
        orderIndex: 6,
        criteria: [
          { id: 'crit_mp_1', title: 'Interval Service Execution', description: 'Completes scheduled belt, fluid, and filter tasks accurately.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_mp_2', title: 'Battery & Fluid Disposal Safety', description: 'Disconnects negative terminal first and disposes waste oil responsibly.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_mp_3', title: 'Service Sticker & Customer Log', description: 'Records mileage, fluids used, and next recommended check.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'trade_plumber',
    slug: 'plumber',
    name: 'Plumber',
    urduName: 'پلمبر',
    description: 'PPR/uPVC pipe fitting, leak repair, geyser & water motor installation, bathroom fixtures, and drainage clearing.',
    icon: 'droplets',
    competencies: [
      {
        id: 'comp_plm_ppr',
        slug: 'ppr-pipe-fusion-fitting',
        title: 'PPR & uPVC Pipe Fitting',
        urduTitle: 'پی پی آر اور پائپ فٹنگ',
        description: 'Cut, heat-fuse PPR joints cleanly without internal restriction, and align wall-concealed or exposed lines.',
        orderIndex: 1,
        criteria: [
          { id: 'crit_plm_p1', title: 'Heat Fusion Depth & Cleanliness', description: 'Clean bevelled pipe cut, dry socket, and accurate heating duration.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_plm_p2', title: 'Heater Die Safety & Burn Prevention', description: 'Rests fusion iron safely on stand with insulated gloves.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_plm_p3', title: 'Pressure & Zero-Drip Test', description: 'Pressurizes completed line and verifies dry joints.', isSafetyCritical: true, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_plm_leak',
        slug: 'leak-detection-fixture-repair',
        title: 'Leak Detection & Fixture Repair',
        urduTitle: 'لیکج کی تشخیص اور مرمت',
        description: 'Replace ceramic cartridges, mixer spindles, flush tank valves, and seal angle valves cleanly.',
        orderIndex: 2,
        criteria: [
          { id: 'crit_plm_l1', title: 'Valve & Isolation Control', description: 'Shuts isolation supply cleanly before disassembly.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_plm_l2', title: 'Thread Sealing & Chrome Care', description: 'Applies PTFE tape neatly and uses padded wrenches without scratching chrome.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_plm_l3', title: 'Watertight Post-Repair Check', description: 'Tests under full line pressure for 10+ minutes without weeping.', isSafetyCritical: true, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_plm_geyser',
        slug: 'geyser-water-motor-installation',
        title: 'Geyser & Water Motor Setup',
        urduTitle: 'گیزر اور واٹر موٹر انسٹالیشن',
        description: 'Install gas/electric geysers and domestic water pumps with non-return valves and pressure safety.',
        orderIndex: 3,
        criteria: [
          { id: 'crit_plm_g1', title: 'PRV & Non-Return Valve Orientation', description: 'Installs pressure relief and check valves in correct flow direction.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_plm_g2', title: 'Gas/Electrical Isolation Safety', description: 'Soap-tests gas union and checks earthing/ELCB for electric geysers.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_plm_g3', title: 'Pump Priming & Vibration Mount', description: 'Mounts pump level and primes impeller without dry running.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_plm_drain',
        slug: 'drainage-trap-maintenance',
        title: 'Drainage & P-Trap Clearing',
        urduTitle: 'نالی اور سیوریج کی صفائی',
        description: 'Clear sink/floor trap blockages, inspect gradient slopes, and re-seal odor traps hygienically.',
        orderIndex: 4,
        criteria: [
          { id: 'crit_plm_d1', title: 'Blockage Clearing Technique', description: 'Uses snake/auger cleanly without damaging PVC bends.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_plm_d2', title: 'Sanitary PPE & Cleanup', description: 'Wears waterproof gloves/mask and disinfects work zone after completion.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_plm_d3', title: 'Flow & Seal Verification', description: 'Confirms rapid drainage and intact water seal in trap.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'trade_ac_technician',
    slug: 'ac-technician',
    name: 'AC Technician',
    urduName: 'اے سی ٹیکنیشن',
    description: 'Split/inverter AC installation, master foam servicing, refrigerant leak checking & refilling, and PCB diagnostics.',
    icon: 'wind',
    competencies: [
      {
        id: 'comp_ac_service',
        slug: 'ac-master-servicing',
        title: 'Master Jet Servicing & Coil Cleaning',
        urduTitle: 'اے سی ماسٹر جیٹ سروسنگ',
        description: 'Cover indoor PCB safely, jet-wash evaporator/condenser fins without bending, and flush drain line.',
        orderIndex: 1,
        criteria: [
          { id: 'crit_ac_s1', title: 'PCB & Wall Waterproof Masking', description: 'Masks electronics and walls with waterproof jacket before jet washing.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ac_s2', title: 'Coil & Blower Deep Clean', description: 'Removes algae/lint cleanly without bending aluminum fins.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ac_s3', title: 'Drain Flow & Temperature Drop Test', description: 'Checks smooth condensation drain and measures supply/return delta-T.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_ac_install',
        slug: 'split-ac-installation',
        title: 'Split & Inverter Installation',
        urduTitle: 'سپلیٹ اور انورٹر اے سی انسٹالیشن',
        description: 'Level indoor plate, flare copper tubing cleanly, vacuum lines, and torque outdoor brackets securely.',
        orderIndex: 2,
        criteria: [
          { id: 'crit_ac_i1', title: 'Copper Flaring & Insulation', description: 'Smooth burr-free flare nuts and intact closed-cell Armaflex insulation.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ac_i2', title: 'Vacuuming & Leak Check', description: 'Pulls deep vacuum before releasing refrigerant; soap-checks flares.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ac_i3', title: 'Anchor Rigidity & Breaker Safety', description: 'Heavy-duty rawal bolts on outdoor bracket and proper earthing.', isSafetyCritical: true, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_ac_gas',
        slug: 'refrigerant-diagnostics-charging',
        title: 'Refrigerant Leak Check & Charging',
        urduTitle: 'گیس لیکج چیک اور ری فلنگ',
        description: 'Pressure-test copper lines, braze pinholes safely, weigh/gauge charge R32/R410a/R22 accurately.',
        orderIndex: 3,
        criteria: [
          { id: 'crit_ac_g1', title: 'Manifold Gauge & Standing Pressure', description: 'Identifies leak before topping up rather than blind refilling.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ac_g2', title: 'R32 Flammability & Brazing Safety', description: 'Purges lines safely and keeps torch/sparks away from flammable refrigerant.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ac_g3', title: 'Ampere Draw & Superheat Verification', description: 'Verifies compressor current draw within nameplate rating.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_ac_pcb',
        slug: 'inverter-error-diagnostics',
        title: 'Inverter Error & Electrical Check',
        urduTitle: 'انورٹر ایرر اور پی سی بی چیک',
        description: 'Diagnose E1/F1 sensor faults, compressor capacitor health, and communication wire integrity.',
        orderIndex: 4,
        criteria: [
          { id: 'crit_ac_p1', title: 'Thermistor & Capacitor Testing', description: 'Accurately tests NTC sensors and run capacitors with multimeter.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_ac_p2', title: 'DC Bus Capacitor Discharge Safety', description: 'De-energizes inverter board and verifies zero DC voltage before handling.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_ac_p3', title: 'Clean Communication Wiring', description: 'Unjointed 3/4-core copper communication cable between indoor and outdoor.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'trade_painter',
    slug: 'painter-polish',
    name: 'Painter & Polish',
    urduName: 'پینٹر اور پالش',
    description: 'Interior & exterior emulsion painting, dampness/seepage treatment, wall putty prep, and wood/deco polish.',
    icon: 'paintbrush',
    competencies: [
      {
        id: 'comp_pnt_prep',
        slug: 'surface-prep-putty',
        title: 'Wall Preparation, Seepage & Putty',
        urduTitle: 'دیوار کی تیاری اور پٹی',
        description: 'Scrape loose flakes, treat dampness with primer, skim smooth wall putty, and sand evenly.',
        orderIndex: 1,
        criteria: [
          { id: 'crit_pnt_p1', title: 'Scraping & Crack Filling', description: 'Removes efflorescence/loose paint cleanly and fills hairline cracks.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_pnt_p2', title: 'Dust Mask & Drop-Sheet Protection', description: 'Protects floors/switches with masking tape and wears sanding mask.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_pnt_p3', title: 'Putty Smoothness & Leveling', description: 'Feather-smooth surface free of trowel ridges under raking light.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_pnt_coat',
        slug: 'interior-exterior-emulsion',
        title: 'Emulsion & Weathercoat Application',
        urduTitle: 'ایملشن اور ویدر کوٹ پینٹ',
        description: 'Cut sharp edges around ceilings/trim and roll uniform coats without lap marks or splatters.',
        orderIndex: 2,
        criteria: [
          { id: 'crit_pnt_c1', title: 'Sharp Cutting-In & Trim Lines', description: 'Clean straight lines at ceiling cornices and door frames.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_pnt_c2', title: 'Ladder & Height Safety', description: 'Uses stable A-frame ladder on level floor without overreaching.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_pnt_c3', title: 'Uniform Opacity & Sheen', description: 'Even finish with zero drips, roller tracks, or missed patches.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_pnt_wood',
        slug: 'wood-polish-deco',
        title: 'Wood Spirit Polish & Deco',
        urduTitle: 'لکڑی پالش اور ڈیکو فنش',
        description: 'Grain-fill timber doors/furniture, stain evenly, and spray/rub clear sealer and lacquer.',
        orderIndex: 3,
        criteria: [
          { id: 'crit_pnt_w1', title: 'Grain Filling & Stain Tone', description: 'Consistent color tone without blotches or sanding burn-throughs.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_pnt_w2', title: 'Solvent Ventilation & Fire Safety', description: 'Keeps thinners/lacquers away from ignition sources with cross-ventilation.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_pnt_w3', title: 'Smooth Final Coat', description: 'Silky matte or gloss topcoat free of runs and dust nibs.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_pnt_damp',
        slug: 'dampness-waterproofing',
        title: 'Dampness & Seepage Treatment',
        urduTitle: 'نمی اور سیم کا علاج',
        description: 'Apply elastomeric waterproofing coatings and anti-fungal barriers before decorative finish.',
        orderIndex: 4,
        criteria: [
          { id: 'crit_pnt_d1', title: 'Moisture Source Assessment', description: 'Checks plumbing/roof joints before sealing surface.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
          { id: 'crit_pnt_d2', title: 'Chemical Eye/Skin PPE', description: 'Wears nitrile gloves and eye protection when mixing elastomeric sealers.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_pnt_d3', title: 'Two-Coat Membrane Coverage', description: 'Applies recommended dry film thickness per manufacturer.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'trade_beauty_parlour',
    slug: 'beauty-parlour-at-home',
    name: 'Beauty Parlour at Home (Women)',
    urduName: 'گھر پر بیوٹی پارلر (خواتین)',
    description: 'Hygienic home salon services by verified female beauticians: facials, waxing, threading, manicure/pedicure, and hair styling.',
    icon: 'sparkles',
    competencies: [
      {
        id: 'comp_bp_hygiene',
        slug: 'sanitization-kit-hygiene',
        title: 'Sanitization & Sealed Kit Hygiene',
        urduTitle: 'صفائی اور سینیٹائزڈ کٹ کا استعمال',
        description: 'Demonstrate sanitized brushes/cutters, disposable wax spatulas, fresh towels, and hygienic station setup.',
        orderIndex: 1,
        criteria: [
          { id: 'crit_bp_h1', title: 'Disposable Applicators & Fresh Linens', description: 'Uses single-use wooden spatulas, cotton pads, and clean towels.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_bp_h2', title: 'Tool Sterilization Protocol', description: 'Sanitizes tweezers, nail clippers, and combs with 70% alcohol/barbicide.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
          { id: 'crit_bp_h3', title: 'Product Expiry & Storage Check', description: 'All creams/serums sealed, labeled, and well within expiry date.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_bp_facial',
        slug: 'skin-prep-facial-care',
        title: 'Skin Prep & Cleansing Facial',
        urduTitle: 'جلد کی دیکھ بھال اور فیشل',
        description: 'Assess skin type, perform gentle cleansing, exfoliation, lymphatic massage, and soothing mask application.',
        orderIndex: 2,
        criteria: [
          { id: 'crit_bp_f1', title: 'Skin Type & Sensitivity Check', description: 'Asks about allergies/acne medications and patch-tests active products.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_bp_f2', title: 'Gentle Extraction & Massage', description: 'Upward rhythmic strokes without harsh pulling or bruising.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_bp_f3', title: 'Post-Facial Care Guidance', description: 'Applies calming toner/SPF and advises clear aftercare.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_bp_wax',
        slug: 'hygienic-waxing-threading',
        title: 'Hygienic Waxing & Threading',
        urduTitle: 'محفوظ ویکسنگ اور تھریڈنگ',
        description: 'Check wax temperature on wrist first, stretch skin cleanly, and apply soothing post-wax lotion.',
        orderIndex: 3,
        criteria: [
          { id: 'crit_bp_w1', title: 'Wax Temperature & Double-Dip Ban', description: 'Tests temperature before applying and never double-dips spatulas.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_bp_w2', title: 'Precision Threading Tension', description: 'Clean brow symmetry without nicking delicate eyelid skin.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_bp_w3', title: 'Post-Care Hygiene & Cleanup', description: 'Removes wax residue neatly and leaves room spotless.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
      {
        id: 'comp_bp_manipedi',
        slug: 'manicure-pedicure-hair',
        title: 'Mani-Pedi & Hair Styling',
        urduTitle: 'مینی پیڈی اور ہیئر سٹائلنگ',
        description: 'Safe cuticle care, warm foot soak hygiene, and heat-protected blowout or party hair styling.',
        orderIndex: 4,
        criteria: [
          { id: 'crit_bp_m1', title: 'Cuticle Safety (Zero Aggressive Cutting)', description: 'Pushes softened cuticles gently without drawing blood.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
          { id: 'crit_bp_m2', title: 'Thermal Heat Protectant Use', description: 'Applies heat-protectant spray and appropriate iron temperature.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
          { id: 'crit_bp_m3', title: 'Balanced Styling Finish', description: 'Neat long-lasting pins, curls, or nail polish finish.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
        ],
      },
    ],
  },
];

function buildGeneratedCompetencies(
  tradeId: string,
  tradeSlug: string,
  tradeName: string,
  tradeUrduName: string
): SeedCompetencyDef[] {
  const shortKey = tradeSlug.replace(/[^a-z0-9]/g, '').slice(0, 12);
  return [
    {
      id: `comp_${shortKey}_prep`,
      slug: `${tradeSlug}-inspection-setup`,
      title: `${tradeName} Inspection & Preparation`,
      urduTitle: `${tradeUrduName} — معائنہ اور تیاری`,
      description: `Assess requirements clearly, inspect site/item condition, and prepare tools & materials before beginning ${tradeName.toLowerCase()} work.`,
      orderIndex: 1,
      criteria: [
        { id: `crt_${shortKey}_p1`, title: 'Accurate Requirement Check', description: 'Confirms scope, measurements, and surface/equipment readiness before starting.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
        { id: `crt_${shortKey}_p2`, title: 'Tool & Material Readiness', description: 'Brings clean, properly functioning tools and authentic consumables.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
        { id: `crt_${shortKey}_p3`, title: 'Worksite Hazard & Hygiene Check', description: 'Identifies electrical, trip, or hygiene risks and protects customer surroundings.', isSafetyCritical: true, maxScore: 3, orderIndex: 3 },
      ],
    },
    {
      id: `comp_${shortKey}_exec`,
      slug: `${tradeSlug}-core-execution`,
      title: `Core ${tradeName} Execution`,
      urduTitle: `${tradeUrduName} — بنیادی عملی مہارت`,
      description: `Deliver accurate, durable, and tidy ${tradeName.toLowerCase()} workmanship following verified practical standards.`,
      orderIndex: 2,
      criteria: [
        { id: `crt_${shortKey}_e1`, title: 'Technical Accuracy & Method', description: 'Applies correct step-by-step technique with zero shortcuts.', isSafetyCritical: false, maxScore: 3, orderIndex: 1 },
        { id: `crt_${shortKey}_e2`, title: 'Safe Handling & Protection', description: 'Uses protective gear/guards and avoids damage to home fixtures or devices.', isSafetyCritical: true, maxScore: 3, orderIndex: 2 },
        { id: `crt_${shortKey}_e3`, title: 'Finish Quality & Neatness', description: 'Clean visual and functional result matching agreed scope.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
      ],
    },
    {
      id: `comp_${shortKey}_safety`,
      slug: `${tradeSlug}-safety-etiquette`,
      title: 'Safety, Hygiene & Household Respect',
      urduTitle: 'حفاظت، صفائی اور پیشہ ورانہ رویہ',
      description: 'Follow personal protective safety, sanitation, waste cleanup, and respectful household conduct.',
      orderIndex: 3,
      criteria: [
        { id: `crt_${shortKey}_s1`, title: 'PPE & Safe Isolation Compliance', description: 'Applies appropriate gloves, masks, insulation, or sanitization protocols.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
        { id: `crt_${shortKey}_s2`, title: 'Site Cleanup After Completion', description: 'Clears debris, packaging, and tools cleanly before handoff.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
        { id: `crt_${shortKey}_s3`, title: 'Transparent Communication', description: 'Explains findings, options, and pricing clearly without hidden charges.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
      ],
    },
    {
      id: `comp_${shortKey}_verify`,
      slug: `${tradeSlug}-testing-handoff`,
      title: 'Quality Verification & Customer Handoff',
      urduTitle: 'معیار کی جانچ اور کسٹمر ہینڈ اوور',
      description: 'Test completed work under load/operation and demonstrate clear results to the customer.',
      orderIndex: 4,
      criteria: [
        { id: `crt_${shortKey}_v1`, title: 'Post-Work Functional Testing', description: 'Verifies smooth operation and zero leaks/faults before closing job.', isSafetyCritical: true, maxScore: 3, orderIndex: 1 },
        { id: `crt_${shortKey}_v2`, title: 'Aftercare & Maintenance Advice', description: 'Shares clear care instructions to keep work reliable.', isSafetyCritical: false, maxScore: 3, orderIndex: 2 },
        { id: `crt_${shortKey}_v3`, title: 'Clear Documentation / Proof', description: 'Records clear before/after photos or maintenance notes when applicable.', isSafetyCritical: false, maxScore: 3, orderIndex: 3 },
      ],
    },
  ];
}

export function buildAllCatalogTradesAndRubrics(nowIso: string): {
  trades: TradeRecord[];
  competencies: CompetencyRecord[];
  rubricCriteria: RubricCriterionRecord[];
} {
  const detailedMap = new Map(DETAILED_TRADES.map((d) => [d.id, d]));
  const trades: TradeRecord[] = [];
  const competencies: CompetencyRecord[] = [];
  const rubricCriteria: RubricCriterionRecord[] = [];

  for (const cat of SERVICE_CATALOG) {
    const detailed = detailedMap.get(cat.id);
    trades.push({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      urduName: cat.urduName,
      group: cat.group,
      urduGroup: cat.urduGroup,
      description: detailed?.description || cat.description,
      icon: cat.icon,
      priceGuide: cat.defaultPriceGuide.map((pg) => ({ ...pg })),
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    const compDefs =
      detailed?.competencies ||
      buildGeneratedCompetencies(cat.id, cat.slug, cat.name, cat.urduName);

    for (const c of compDefs) {
      competencies.push({
        id: c.id,
        tradeId: cat.id,
        slug: c.slug,
        title: c.title,
        urduTitle: c.urduTitle,
        description: c.description,
        orderIndex: c.orderIndex,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      for (const r of c.criteria) {
        rubricCriteria.push({
          id: r.id,
          competencyId: c.id,
          title: r.title,
          description: r.description,
          isSafetyCritical: r.isSafetyCritical,
          maxScore: r.maxScore,
          orderIndex: r.orderIndex,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }
    }
  }

  return { trades, competencies, rubricCriteria };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function buildHistoricalJobBatch(params: {
  prefix: string;
  count: number;
  workerProfileId: string;
  tradeId: string;
  city: string;
  areas: string[];
  titles: string[];
  ratings: number[];
  comments: string[];
  minPkr: number;
  maxPkr: number;
  assessorVerifiedProofAssets?: Array<{ before: string; after: string; caption: string }>;
}): { jobs: JobRecord[]; reviews: ReviewRecord[]; earnings: EarningsLogRecord[] } {
  const jobs: JobRecord[] = [];
  const reviews: ReviewRecord[] = [];
  const earnings: EarningsLogRecord[] = [];
  const customers = [
    { userId: 'user_employer_sana', empId: 'employer_sana' },
    { userId: 'user_customer_ahmed', empId: 'employer_ahmed' },
  ];

  for (let i = 0; i < params.count; i++) {
    const cust = customers[i % customers.length];
    const ageDays = 6 + i * 4;
    const reqIso = daysAgoIso(ageDays + 2);
    const accIso = daysAgoIso(ageDays + 1);
    const compIso = daysAgoIso(ageDays);
    const jobId = `job_seed_${params.prefix}_${i + 1}`;
    const price = params.minPkr + ((i * 350) % Math.max(400, params.maxPkr - params.minPkr));
    const title = params.titles[i % params.titles.length];
    const area = params.areas[i % params.areas.length];
    const proofSpec =
      params.assessorVerifiedProofAssets && i < params.assessorVerifiedProofAssets.length
        ? params.assessorVerifiedProofAssets[i]
        : null;

    jobs.push({
      id: jobId,
      customerUserId: cust.userId,
      employerProfileId: cust.empId,
      workerProfileId: params.workerProfileId,
      tradeId: params.tradeId,
      title,
      description: `${title} requested in ${area}, ${params.city}. Verified inspection and clean finishing needed.`,
      city: params.city,
      area,
      preferredDate: compIso.slice(0, 10),
      preferredTimeSlot: '11:00 AM - 02:00 PM',
      scheduledDateTime: compIso,
      problemPhotos: [],
      beforePhotos: proofSpec
        ? [{ id: `jp_b_${jobId}`, fileKey: `seed_before_${jobId}`, seedAssetPath: proofSpec.before, originalName: 'before-work.jpg', mimeType: 'image/jpeg', caption: 'Before service' }]
        : [],
      afterPhotos: proofSpec
        ? [{ id: `jp_a_${jobId}`, fileKey: `seed_after_${jobId}`, seedAssetPath: proofSpec.after, originalName: 'after-work.jpg', mimeType: 'image/jpeg', caption: proofSpec.caption }]
        : [],
      quotedPkr: price,
      finalPkr: price,
      priceStatus: 'WITHIN_GUIDE',
      workerNotes: 'Inspected on site and completed within fair price guide.',
      completionNotes: 'Completed, tested under load, and customer walked through final check.',
      customerConfirmedProof: true,
      customerConfirmedAt: compIso,
      status: 'COMPLETED',
      cancelledByRole: null,
      cancelReason: '',
      requestedAt: reqIso,
      acceptedAt: accIso,
      startedAt: compIso,
      completedAt: compIso,
      updatedAt: compIso,
    });

    earnings.push({
      id: `earn_${jobId}`,
      workerProfileId: params.workerProfileId,
      jobId,
      title,
      amountPkr: price,
      date: compIso.slice(0, 10),
      notes: `Completed job in ${area}`,
      createdAt: compIso,
    });

    // Attach rich verified reviews for first 8 jobs per worker so lists feel authentic & fast
    if (i < 8) {
      const rating = params.ratings[i % params.ratings.length];
      const comment = params.comments[i % params.comments.length];
      reviews.push({
        id: `rev_seed_${params.prefix}_${i + 1}`,
        jobId,
        customerUserId: cust.userId,
        workerProfileId: params.workerProfileId,
        tradeId: params.tradeId,
        overallRating: rating,
        qualityRating: Math.min(5, rating),
        punctualityRating: rating >= 4 ? rating : 4,
        behaviourRating: 5,
        valueRating: Math.max(4, rating),
        tags: i % 2 === 0 ? ['On time', 'Clean work', 'Would hire again'] : ['Explained the problem', 'Fair price'],
        comment,
        photos: [],
        workerReply: i === 0 ? 'Thank you for your trust! Always happy to deliver neat, safe work.' : '',
        workerRepliedAt: i === 0 ? compIso : null,
        isHiddenByAdmin: false,
        hiddenReason: '',
        editableUntil: compIso,
        createdAt: compIso,
        updatedAt: compIso,
      });
    }
  }

  return { jobs, reviews, earnings };
}

export interface V2SeedAdditions {
  extraUsers: UserRecord[];
  extraAssessors: AssessorProfileRecord[];
  extraEmployers: EmployerProfileRecord[];
  extraWorkers: WorkerProfileRecord[];
  extraRequests: AssessmentRequestRecord[];
  extraItems: AssessmentItemRecord[];
  extraBadges: BadgeRecord[];
  jobs: JobRecord[];
  reviews: ReviewRecord[];
  earningsLogs: EarningsLogRecord[];
  tierApplications: TierApplicationRecord[];
  extraAuditLogs: AuditLogRecord[];
  extraNotifications: NotificationRecord[];
}

export async function buildV2SeedAdditions(): Promise<V2SeedAdditions> {
  const now = new Date().toISOString();
  const demoPass = 'KarigarDemo@2026';
  const [ahmedCred, zainabCred, hamzaCred, tariqPlmCred, sohailCred] = await Promise.all([
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
  ]);

  const extraUsers: UserRecord[] = [
    {
      id: 'user_customer_ahmed',
      fullName: 'Ahmed Raza (Homeowner)',
      email: 'ahmed.customer@karigarconnect.pk',
      phone: '+92-321-5550198',
      passwordHash: ahmedCred.hash,
      passwordSalt: ahmedCred.salt,
      role: 'EMPLOYER',
      city: 'Karachi',
      status: 'ACTIVE',
      createdAt: daysAgoIso(180),
      updatedAt: now,
    },
    {
      id: 'user_worker_zainab',
      fullName: 'Zainab Fatima',
      email: 'zainab.beauty@karigarconnect.pk',
      phone: '+92-301-8800412',
      passwordHash: zainabCred.hash,
      passwordSalt: zainabCred.salt,
      role: 'WORKER',
      city: 'Multan',
      status: 'ACTIVE',
      createdAt: daysAgoIso(135),
      updatedAt: now,
    },
    {
      id: 'user_worker_hamza',
      fullName: 'Hamza Afridi',
      email: 'hamza.ac@karigarconnect.pk',
      phone: '+92-333-9100422',
      passwordHash: hamzaCred.hash,
      passwordSalt: hamzaCred.salt,
      role: 'WORKER',
      city: 'Peshawar',
      status: 'ACTIVE',
      createdAt: daysAgoIso(75),
      updatedAt: now,
    },
    {
      id: 'user_worker_tariq_plm',
      fullName: 'Tariq Baloch',
      email: 'tariq.plumber@karigarconnect.pk',
      phone: '+92-312-8200433',
      passwordHash: tariqPlmCred.hash,
      passwordSalt: tariqPlmCred.salt,
      role: 'WORKER',
      city: 'Quetta',
      status: 'ACTIVE',
      createdAt: daysAgoIso(105),
      updatedAt: now,
    },
    {
      id: 'user_worker_sohail',
      fullName: 'Sohail Memon',
      email: 'sohail.appliance@karigarconnect.pk',
      phone: '+92-345-2300444',
      passwordHash: sohailCred.hash,
      passwordSalt: sohailCred.salt,
      role: 'WORKER',
      city: 'Karachi',
      status: 'ACTIVE',
      createdAt: daysAgoIso(85),
      updatedAt: now,
    },
  ];

  const extraEmployers: EmployerProfileRecord[] = [
    {
      id: 'employer_ahmed',
      userId: 'user_customer_ahmed',
      accountType: 'INDIVIDUAL',
      companyName: '',
      industry: 'Homeowner / Family Household',
      city: 'Karachi',
      website: '',
      description: 'Homeowner hiring verified technicians for family apartment repairs and maintenance.',
      createdAt: daysAgoIso(180),
      updatedAt: now,
    },
  ];

  const extraWorkers: WorkerProfileRecord[] = [
    {
      id: 'worker_zainab',
      userId: 'user_worker_zainab',
      publicId: 'zainab-fatima-beauty',
      passportId: 'KC-PASS-ZAINAB',
      selectedTradeId: 'trade_beauty_parlour',
      yearsExperience: 6,
      bio: 'Certified female home-salon specialist offering sanitized facials, threading, waxing, and bridal prep exclusively for women at home in Multan.',
      skills: ['Hydra & Herbal Facial', 'Sanitized Waxing Kit', 'Threading & Brow Shaping', 'Bridal Hair Styling'],
      certificates: [{ title: 'Salon Hygiene & Sterilization Workshop', issuer: 'Multan Women Vocational Center', year: '2024' }],
      showCertificates: true,
      avatarUrl: '/images/avatar_bilal_1795340853872.jpg',
      isPublic: true,
      isFemaleProfessional: true,
      tier: 'SILVER',
      tierStatus: 'ACTIVE',
      tierIssuedAt: daysAgoIso(15),
      tierExpiresAt: daysFromNowIso(350),
      tierUnderReview: false,
      createdAt: daysAgoIso(135),
      updatedAt: now,
    },
    {
      id: 'worker_hamza',
      userId: 'user_worker_hamza',
      publicId: 'hamza-afridi-ac',
      passportId: 'KC-PASS-HAMZA',
      selectedTradeId: 'trade_ac_technician',
      yearsExperience: 8,
      bio: 'Inverter and split AC specialist in Peshawar with waterproof jet-wash equipment, vacuum pump, and digital manifold diagnostics.',
      skills: ['Split AC Installation', 'Master Jet Wash', 'R32/R410a Vacuum & Charge', 'Inverter PCB Check'],
      certificates: [],
      showCertificates: true,
      avatarUrl: '/images/hero_karigar_trades_1795340854886.jpg',
      isPublic: true,
      isFemaleProfessional: false,
      tier: 'BRONZE',
      tierStatus: 'ACTIVE',
      tierIssuedAt: daysAgoIso(12),
      tierExpiresAt: daysFromNowIso(353),
      tierUnderReview: false,
      createdAt: daysAgoIso(75),
      updatedAt: now,
    },
    {
      id: 'worker_tariq_plm',
      userId: 'user_worker_tariq_plm',
      publicId: 'tariq-baloch-plumber',
      passportId: 'KC-PASS-TARIQP',
      selectedTradeId: 'trade_plumber',
      yearsExperience: 9,
      bio: 'Experienced Quetta plumber handling PPR heat fusion, winter geyser safety valves, concealed leakage repair, and water motor installation.',
      skills: ['PPR Heat Fusion', 'Gas/Electric Geyser Setup', 'Leak Tracing', 'Water Pump Priming'],
      certificates: [],
      showCertificates: true,
      avatarUrl: '/images/trade_electrician_1795340853927.jpg',
      isPublic: true,
      isFemaleProfessional: false,
      tier: 'BRONZE',
      tierStatus: 'ACTIVE',
      tierIssuedAt: daysAgoIso(20),
      tierExpiresAt: daysFromNowIso(345),
      tierUnderReview: false,
      createdAt: daysAgoIso(105),
      updatedAt: now,
    },
    {
      id: 'worker_sohail',
      userId: 'user_worker_sohail',
      publicId: 'sohail-memon-appliance',
      passportId: 'KC-PASS-SOHAIL',
      selectedTradeId: 'trade_appliance',
      yearsExperience: 7,
      bio: 'Doorstep technician in Karachi for inverter refrigerators, automatic washing machines, microwaves, and instant geysers.',
      skills: ['Inverter Fridge Diagnostics', 'Automatic Washer Drum', 'Microwave Magnetron Check', 'Instant Geyser Repair'],
      certificates: [],
      showCertificates: true,
      avatarUrl: '/images/trade_mechanic_1795340854456.jpg',
      isPublic: true,
      isFemaleProfessional: false,
      tier: 'BRONZE',
      tierStatus: 'ACTIVE',
      tierIssuedAt: daysAgoIso(10),
      tierExpiresAt: daysFromNowIso(355),
      tierUnderReview: false,
      createdAt: daysAgoIso(85),
      updatedAt: now,
    },
  ];

  // Extra verified competency requests, items & badges so Bilal has 3 verified competencies (GOLD), Nadia has 2 (SILVER), Zainab 2, Tariq_plm 2, Hamza 1, Sohail 1
  const extraRequests: AssessmentRequestRecord[] = [
    { id: 'req_seed_bilal_install', workerProfileId: 'worker_bilal', tradeId: 'trade_electrician', status: 'COMPLETED', requestedAt: daysAgoIso(55), completedAt: daysAgoIso(52), updatedAt: daysAgoIso(52) },
    { id: 'req_seed_bilal_trouble', workerProfileId: 'worker_bilal', tradeId: 'trade_electrician', status: 'COMPLETED', requestedAt: daysAgoIso(32), completedAt: daysAgoIso(30), updatedAt: daysAgoIso(30) },
    { id: 'req_seed_nadia_joinery', workerProfileId: 'worker_nadia', tradeId: 'trade_carpenter', status: 'COMPLETED', requestedAt: daysAgoIso(40), completedAt: daysAgoIso(38), updatedAt: daysAgoIso(38) },
    { id: 'req_seed_zainab_1', workerProfileId: 'worker_zainab', tradeId: 'trade_beauty_parlour', status: 'COMPLETED', requestedAt: daysAgoIso(50), completedAt: daysAgoIso(47), updatedAt: daysAgoIso(47) },
    { id: 'req_seed_zainab_2', workerProfileId: 'worker_zainab', tradeId: 'trade_beauty_parlour', status: 'COMPLETED', requestedAt: daysAgoIso(25), completedAt: daysAgoIso(22), updatedAt: daysAgoIso(22) },
    { id: 'req_seed_hamza_1', workerProfileId: 'worker_hamza', tradeId: 'trade_ac_technician', status: 'COMPLETED', requestedAt: daysAgoIso(28), completedAt: daysAgoIso(25), updatedAt: daysAgoIso(25) },
    { id: 'req_seed_tariqp_1', workerProfileId: 'worker_tariq_plm', tradeId: 'trade_plumber', status: 'COMPLETED', requestedAt: daysAgoIso(45), completedAt: daysAgoIso(42), updatedAt: daysAgoIso(42) },
    { id: 'req_seed_tariqp_2', workerProfileId: 'worker_tariq_plm', tradeId: 'trade_plumber', status: 'COMPLETED', requestedAt: daysAgoIso(18), completedAt: daysAgoIso(16), updatedAt: daysAgoIso(16) },
    { id: 'req_seed_sohail_1', workerProfileId: 'worker_sohail', tradeId: 'trade_appliance', status: 'COMPLETED', requestedAt: daysAgoIso(26), completedAt: daysAgoIso(23), updatedAt: daysAgoIso(23) },
  ];

  const mkItem = (id: string, requestId: string, competencyId: string, score: number, max: number, level: 'COMPETENT' | 'ADVANCED', ago: number, feedback: string): AssessmentItemRecord => ({
    id,
    requestId,
    competencyId,
    assessorProfileId: 'assessor_tariq',
    status: 'VERIFIED',
    totalScore: score,
    maxScore: max,
    percentage: Math.round((score / max) * 1000) / 10,
    level,
    feedback,
    assessedAt: daysAgoIso(ago),
    isAppealed: false,
    appealReason: '',
    appealStatus: 'NONE',
    appealedFromItemId: null,
    createdAt: daysAgoIso(ago + 2),
    updatedAt: daysAgoIso(ago),
  });

  const extraItems: AssessmentItemRecord[] = [
    mkItem('item_seed_bilal_install', 'req_seed_bilal_install', 'comp_elec_install', 8, 9, 'ADVANCED', 52, 'Neat MCB/RCCB load grouping and proper earthing verification.'),
    mkItem('item_seed_bilal_trouble', 'req_seed_bilal_trouble', 'comp_elec_troubleshoot', 8, 9, 'ADVANCED', 30, 'Accurate multimeter fault isolation and earth leakage tracing.'),
    mkItem('item_seed_nadia_joinery', 'req_seed_nadia_joinery', 'comp_carp_joinery', 7, 9, 'COMPETENT', 38, 'Tight joint fit and disciplined chisel clamping safety.'),
    mkItem('item_seed_zainab_1', 'req_seed_zainab_1', 'comp_bp_hygiene', 9, 9, 'ADVANCED', 47, 'Exemplary single-use spatula protocol and alcohol sanitization.'),
    mkItem('item_seed_zainab_2', 'req_seed_zainab_2', 'comp_bp_facial', 8, 9, 'ADVANCED', 22, 'Patch-tested skin check and gentle rhythmic facial prep.'),
    mkItem('item_seed_hamza_1', 'req_seed_hamza_1', 'comp_ac_service', 8, 9, 'ADVANCED', 25, 'Full waterproof PCB jacket used prior to coil jet wash.'),
    mkItem('item_seed_tariqp_1', 'req_seed_tariqp_1', 'comp_plm_ppr', 8, 9, 'ADVANCED', 42, 'Clean PPR fusion alignment and pressure hold test passed.'),
    mkItem('item_seed_tariqp_2', 'req_seed_tariqp_2', 'comp_plm_geyser', 7, 9, 'COMPETENT', 16, 'Proper PRV orientation and gas union soap-leak check.'),
    mkItem('item_seed_sohail_1', 'req_seed_sohail_1', 'comp_applianc_safety', 7, 9, 'COMPETENT', 23, 'Safe appliance isolation and organized household testing.'),
  ];

  // Note: sohail's competency slug key in buildGeneratedCompetencies is tradeSlug.replace(/[^a-z0-9]/g,'').slice(0,12) -> 'appliancerep'
  extraItems[extraItems.length - 1].competencyId = 'comp_appliancerep_safety';

  const mkBadge = (id: string, wpId: string, compId: string, tradeId: string, itemId: string, level: 'COMPETENT' | 'ADVANCED', ago: number): BadgeRecord => ({
    id,
    workerProfileId: wpId,
    competencyId: compId,
    tradeId,
    assessmentItemId: itemId,
    assessorProfileId: 'assessor_tariq',
    level,
    issuedAt: daysAgoIso(ago),
    expiresAt: daysFromNowIso(365 - ago),
    status: 'ACTIVE',
    createdAt: daysAgoIso(ago),
    updatedAt: daysAgoIso(ago),
  });

  const extraBadges: BadgeRecord[] = [
    mkBadge('badge_seed_bilal_install', 'worker_bilal', 'comp_elec_install', 'trade_electrician', 'item_seed_bilal_install', 'ADVANCED', 52),
    mkBadge('badge_seed_bilal_trouble', 'worker_bilal', 'comp_elec_troubleshoot', 'trade_electrician', 'item_seed_bilal_trouble', 'ADVANCED', 30),
    mkBadge('badge_seed_nadia_joinery', 'worker_nadia', 'comp_carp_joinery', 'trade_carpenter', 'item_seed_nadia_joinery', 'COMPETENT', 38),
    mkBadge('badge_seed_zainab_1', 'worker_zainab', 'comp_bp_hygiene', 'trade_beauty_parlour', 'item_seed_zainab_1', 'ADVANCED', 47),
    mkBadge('badge_seed_zainab_2', 'worker_zainab', 'comp_bp_facial', 'trade_beauty_parlour', 'item_seed_zainab_2', 'ADVANCED', 22),
    mkBadge('badge_seed_hamza_1', 'worker_hamza', 'comp_ac_service', 'trade_ac_technician', 'item_seed_hamza_1', 'ADVANCED', 25),
    mkBadge('badge_seed_tariqp_1', 'worker_tariq_plm', 'comp_plm_ppr', 'trade_plumber', 'item_seed_tariqp_1', 'ADVANCED', 42),
    mkBadge('badge_seed_tariqp_2', 'worker_tariq_plm', 'comp_plm_geyser', 'trade_plumber', 'item_seed_tariqp_2', 'COMPETENT', 16),
    mkBadge('badge_seed_sohail_1', 'worker_sohail', 'comp_appliancerep_safety', 'trade_appliance', 'item_seed_sohail_1', 'COMPETENT', 23),
  ];

  // Historical jobs & reviews
  const bilalHist = buildHistoricalJobBatch({
    prefix: 'bilal',
    count: 41,
    workerProfileId: 'worker_bilal',
    tradeId: 'trade_electrician',
    city: 'Islamabad',
    areas: ['F-10 Markaz', 'G-11/3', 'E-11', 'Bahria Town Phase 4', 'I-8/4'],
    titles: ['Main DB RCCB & Earthing Upgrade', 'UPS Changeover Rewiring', 'Kitchen Power Socket Fault Fix', 'Ceiling Fan & Dimmer Setup'],
    ratings: [5, 5, 5, 4, 5, 5, 4, 5],
    comments: [
      'Arrived right on time in F-10, checked earthing with a meter before starting, and labeled every breaker cleanly.',
      'Solved a recurring UPS tripping issue that two earlier technicians missed. Fair price and very respectful.',
      'کام بہت صاف ستھرا کیا اور بریکر باکس پر لیبل بھی لگا دیے۔ وقت کی پابندی زبردست تھی۔',
      'Explained the neutral fault clearly before replacing the burnt terminal block.',
    ],
    minPkr: 1400,
    maxPkr: 4200,
    assessorVerifiedProofAssets: [
      { before: '/images/hero_karigar_trades_1795340854886.jpg', after: '/images/trade_electrician_1795340853927.jpg', caption: 'Dressed DB panel with labeled MCB/RCCB breakers' },
      { before: '/images/trade_electrician_1795340853927.jpg', after: '/images/hero_karigar_trades_1795340854886.jpg', caption: 'Zero-energy safety check & earthing continuity confirmed' },
    ],
  });

  const nadiaHist = buildHistoricalJobBatch({
    prefix: 'nadia',
    count: 16,
    workerProfileId: 'worker_nadia',
    tradeId: 'trade_carpenter',
    city: 'Lahore',
    areas: ['DHA Phase 5', 'Model Town', 'Gulberg III', 'Johar Town'],
    titles: ['Kitchen Cabinet Soft-Close Hinges', 'Solid Wood Door Lock & Frame Align', 'Wardrobe Drawer Runners Replacement'],
    ratings: [5, 4, 4, 5, 4, 5, 4, 4],
    comments: [
      'Aligned three sagging kitchen shutters smoothly and vacuumed sawdust afterwards.',
      'Clean mortise work for our main bedroom lock. Exact measurements and sturdy fit.',
      'بہت نفاست سے دروازوں کی سیٹنگ کی اور قیمت بھی مناسب رکھی۔',
    ],
    minPkr: 1800,
    maxPkr: 4500,
    assessorVerifiedProofAssets: [
      { before: '/images/trade_carpenter_1795340854383.jpg', after: '/images/trade_carpenter_1795340854383.jpg', caption: 'Custom wardrobe hinges & flush alignment confirmed' },
    ],
  });

  const usmanHist = buildHistoricalJobBatch({
    prefix: 'usman',
    count: 6,
    workerProfileId: 'worker_usman',
    tradeId: 'trade_mechanic',
    city: 'Rawalpindi',
    areas: ['Chaklala Scheme III', 'Saddar', 'Bahria Phase 7'],
    titles: ['Front Brake Pad & Rotor Check', 'Doorstep 40,000km Oil & Filter Service', 'OBD-II Check Engine Scan'],
    ratings: [5, 4, 4, 4, 5, 4],
    comments: [
      'Used jack stands safely and measured pad thickness in front of me. Honest guidance.',
      'Quick doorstep oil and filter swap with zero mess on the driveway.',
    ],
    minPkr: 1600,
    maxPkr: 3400,
    assessorVerifiedProofAssets: [
      { before: '/images/trade_mechanic_1795340854456.jpg', after: '/images/trade_mechanic_1795340854456.jpg', caption: 'Brake caliper service and lug torque verified' },
    ],
  });

  const zainabHist = buildHistoricalJobBatch({
    prefix: 'zainab',
    count: 17,
    workerProfileId: 'worker_zainab',
    tradeId: 'trade_beauty_parlour',
    city: 'Multan',
    areas: ['Model Town Multan', 'Cantt', 'Gulgasht Colony'],
    titles: ['Home Cleansing Facial & Threading', 'Full Mani-Pedi & Hygienic Wax Package', 'Party Hair Styling & Prep'],
    ratings: [5, 5, 5, 5, 4, 5, 5, 5],
    comments: [
      'Brought sealed disposable spatulas and sanitized everything in front of me. Very comfortable home experience.',
      'انتہائی صاف ستھرا کام اور بہترین اخلاق۔ خواتین کے لیے گھر پر محفوظ ترین سروس۔',
    ],
    minPkr: 2400,
    maxPkr: 5500,
  });

  const hamzaHist = buildHistoricalJobBatch({
    prefix: 'hamza',
    count: 7,
    workerProfileId: 'worker_hamza',
    tradeId: 'trade_ac_technician',
    city: 'Peshawar',
    areas: ['Hayatabad Phase 3', 'University Town'],
    titles: ['1.5 Ton Inverter AC Master Service', 'Drain Pipe Flush & Gas Check'],
    ratings: [5, 4, 5, 4, 5, 4, 4],
    comments: [
      'Used full waterproof AC cover so not a single drop splashed on the bedroom wall.',
    ],
    minPkr: 2000,
    maxPkr: 3200,
  });

  const tariqPlmHist = buildHistoricalJobBatch({
    prefix: 'tariqp',
    count: 16,
    workerProfileId: 'worker_tariq_plm',
    tradeId: 'trade_plumber',
    city: 'Quetta',
    areas: ['Jinnah Town', 'Satellite Town', 'Model Town Quetta'],
    titles: ['Instant Geyser Pressure Valve & Setup', 'Concealed PPR Bathroom Mixer Leak Fix'],
    ratings: [5, 4, 5, 4, 5, 4, 5, 4],
    comments: [
      'Solved winter geyser pressure drop and soap-tested all gas connections carefully.',
    ],
    minPkr: 1500,
    maxPkr: 3500,
  });

  const sohailHist = buildHistoricalJobBatch({
    prefix: 'sohail',
    count: 8,
    workerProfileId: 'worker_sohail',
    tradeId: 'trade_appliance',
    city: 'Karachi',
    areas: ['Gulshan-e-Iqbal', 'DHA Phase 6', 'PECHS Block 2'],
    titles: ['Inverter Fridge Cooling Diagnostics', 'Automatic Washing Machine Drain Pump'],
    ratings: [5, 5, 4, 5, 4, 5, 4, 5],
    comments: [
      'Fixed our washing machine drain pump in one visit without upselling unnecessary parts.',
    ],
    minPkr: 1500,
    maxPkr: 3800,
  });

  // Add 2 live interactive demo jobs for Sana so Customer & Worker job lifecycle screens have immediate active rows
  const liveDemoJobs: JobRecord[] = [
    {
      id: 'job_live_sana_requested',
      customerUserId: 'user_employer_sana',
      employerProfileId: 'employer_sana',
      workerProfileId: 'worker_bilal',
      tradeId: 'trade_electrician',
      title: 'Sub-meter & Kitchen Breaker Load Balance',
      description: 'Need an electrician to check occasional breaker trip when microwave and water dispenser run together in G-10 office kitchenette.',
      city: 'Islamabad',
      area: 'G-10 Markaz',
      preferredDate: daysFromNowIso(2).slice(0, 10),
      preferredTimeSlot: '02:00 PM - 05:00 PM',
      scheduledDateTime: null,
      problemPhotos: [],
      beforePhotos: [],
      afterPhotos: [],
      quotedPkr: null,
      finalPkr: null,
      priceStatus: 'NO_GUIDE',
      workerNotes: '',
      completionNotes: '',
      customerConfirmedProof: false,
      customerConfirmedAt: null,
      status: 'REQUESTED',
      cancelledByRole: null,
      cancelReason: '',
      requestedAt: daysAgoIso(1),
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'job_live_sana_inprogress',
      customerUserId: 'user_employer_sana',
      employerProfileId: 'employer_sana',
      workerProfileId: 'worker_nadia',
      tradeId: 'trade_carpenter',
      title: 'Office Reception Counter Door Alignment',
      description: 'Hinges on laminated storage cabinet need adjustment and soft-close dampers fitted.',
      city: 'Lahore',
      area: 'Gulberg III',
      preferredDate: now.slice(0, 10),
      preferredTimeSlot: '11:00 AM - 02:00 PM',
      scheduledDateTime: now,
      problemPhotos: [],
      beforePhotos: [{ id: 'jp_live_b1', fileKey: 'seed_live_b1', seedAssetPath: '/images/trade_carpenter_1795340854383.jpg', originalName: 'cabinet-before.jpg', mimeType: 'image/jpeg', caption: 'Cabinet hinge misalignment before work' }],
      afterPhotos: [],
      quotedPkr: 2200,
      finalPkr: null,
      priceStatus: 'WITHIN_GUIDE',
      workerNotes: 'Bringing replacement hydraulic hinges.',
      completionNotes: '',
      customerConfirmedProof: false,
      customerConfirmedAt: null,
      status: 'IN_PROGRESS',
      cancelledByRole: null,
      cancelReason: '',
      requestedAt: daysAgoIso(2),
      acceptedAt: daysAgoIso(1),
      startedAt: now,
      completedAt: null,
      updatedAt: now,
    },
  ];

  const tierApplications: TierApplicationRecord[] = [
    {
      id: 'tapp_seed_tariq_silver',
      workerProfileId: 'worker_tariq_plm',
      requestedTier: 'SILVER',
      status: 'PENDING',
      trustScoreSnapshot: 78,
      adminNotes: '',
      reviewedByUserId: null,
      createdAt: daysAgoIso(1),
      reviewedAt: null,
    },
  ];

  const extraAuditLogs: AuditLogRecord[] = [
    {
      id: 'audit_v2_gold_bilal',
      actorUserId: 'user_admin_1',
      action: 'TIER_APPROVED',
      entityType: 'WorkerProfile',
      entityId: 'worker_bilal',
      description: 'Approved GOLD Karigar Tier for Bilal Ahmed (Islamabad — Electrician).',
      createdAt: daysAgoIso(10),
    },
    {
      id: 'audit_v2_silver_nadia',
      actorUserId: 'user_admin_1',
      action: 'TIER_APPROVED',
      entityType: 'WorkerProfile',
      entityId: 'worker_nadia',
      description: 'Approved SILVER Karigar Tier for Nadia Hussain (Lahore — Carpenter).',
      createdAt: daysAgoIso(12),
    },
  ];

  const extraNotifications: NotificationRecord[] = [
    {
      id: 'notif_v2_admin_tier',
      userId: 'user_admin_1',
      type: 'TIER_APPLICATION',
      title: 'Tier Upgrade Ready: Tariq Baloch (Silver)',
      message: 'Tariq Baloch (Quetta, Plumber) meets all Silver tier criteria and awaits Admin approval.',
      link: '/admin/tiers',
      isRead: false,
      createdAt: daysAgoIso(1),
    },
    {
      id: 'notif_v2_bilal_job',
      userId: 'user_worker_bilal',
      type: 'JOB_REQUESTED',
      title: 'New Job Request: Sub-meter & Kitchen Breaker Load Balance',
      message: 'Ms. Sana Malik requested a quote in G-10 Markaz, Islamabad.',
      link: '/worker/jobs',
      isRead: false,
      createdAt: daysAgoIso(1),
    },
  ];

  return {
    extraUsers,
    extraAssessors: [],
    extraEmployers,
    extraWorkers,
    extraRequests,
    extraItems,
    extraBadges,
    jobs: [
      ...bilalHist.jobs,
      ...nadiaHist.jobs,
      ...usmanHist.jobs,
      ...zainabHist.jobs,
      ...hamzaHist.jobs,
      ...tariqPlmHist.jobs,
      ...sohailHist.jobs,
      ...liveDemoJobs,
    ],
    reviews: [
      ...bilalHist.reviews,
      ...nadiaHist.reviews,
      ...usmanHist.reviews,
      ...zainabHist.reviews,
      ...hamzaHist.reviews,
      ...tariqPlmHist.reviews,
      ...sohailHist.reviews,
    ],
    earningsLogs: [
      ...bilalHist.earnings,
      ...nadiaHist.earnings,
      ...usmanHist.earnings,
      ...zainabHist.earnings,
      ...hamzaHist.earnings,
      ...tariqPlmHist.earnings,
      ...sohailHist.earnings,
    ],
    tierApplications,
    extraAuditLogs,
    extraNotifications,
  };
}

export async function buildInitialSeedDatabase(): Promise<InternalDatabaseSchema> {
  const now = new Date().toISOString();
  const demoPass = 'KarigarDemo@2026';

  const [adminCred, tariqCred, kamranCred, sanaCred, bilalCred, nadiaCred, usmanCred] = await Promise.all([
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
    hashPassword(demoPass),
  ]);

  const { trades, competencies, rubricCriteria } = buildAllCatalogTradesAndRubrics(now);
  const v2 = await buildV2SeedAdditions();

  const users: UserRecord[] = [
    {
      id: 'user_admin_1',
      fullName: 'Ayesha Siddiqui (Platform Admin)',
      email: 'admin@karigarconnect.pk',
      phone: '+92-300-0000100',
      passwordHash: adminCred.hash,
      passwordSalt: adminCred.salt,
      role: 'ADMIN',
      city: 'Islamabad',
      status: 'ACTIVE',
      createdAt: daysAgoIso(240),
      updatedAt: now,
    },
    {
      id: 'user_assessor_tariq',
      fullName: 'Mr. Tariq Mahmood',
      email: 'tariq.assessor@karigarconnect.pk',
      phone: '+92-300-0000201',
      passwordHash: tariqCred.hash,
      passwordSalt: tariqCred.salt,
      role: 'ASSESSOR',
      city: 'Islamabad',
      status: 'ACTIVE',
      createdAt: daysAgoIso(220),
      updatedAt: now,
    },
    {
      id: 'user_assessor_kamran',
      fullName: 'Kamran Qureshi',
      email: 'kamran.assessor@karigarconnect.pk',
      phone: '+92-300-0000202',
      passwordHash: kamranCred.hash,
      passwordSalt: kamranCred.salt,
      role: 'ASSESSOR',
      city: 'Lahore',
      status: 'ACTIVE',
      createdAt: daysAgoIso(3),
      updatedAt: now,
    },
    {
      id: 'user_employer_sana',
      fullName: 'Ms. Sana Malik',
      email: 'sana.employer@karigarconnect.pk',
      phone: '+92-300-0000301',
      passwordHash: sanaCred.hash,
      passwordSalt: sanaCred.salt,
      role: 'EMPLOYER',
      city: 'Islamabad',
      status: 'ACTIVE',
      createdAt: daysAgoIso(190),
      updatedAt: now,
    },
    {
      id: 'user_worker_bilal',
      fullName: 'Bilal Ahmed',
      email: 'bilal.worker@karigarconnect.pk',
      phone: '+92-300-0000401',
      passwordHash: bilalCred.hash,
      passwordSalt: bilalCred.salt,
      role: 'WORKER',
      city: 'Islamabad',
      status: 'ACTIVE',
      createdAt: daysAgoIso(210),
      updatedAt: now,
    },
    {
      id: 'user_worker_nadia',
      fullName: 'Nadia Hussain',
      email: 'nadia.carpenter@karigarconnect.pk',
      phone: '+92-300-0000402',
      passwordHash: nadiaCred.hash,
      passwordSalt: nadiaCred.salt,
      role: 'WORKER',
      city: 'Lahore',
      status: 'ACTIVE',
      createdAt: daysAgoIso(125),
      updatedAt: now,
    },
    {
      id: 'user_worker_usman',
      fullName: 'Usman Raza',
      email: 'usman.mechanic@karigarconnect.pk',
      phone: '+92-300-0000403',
      passwordHash: usmanCred.hash,
      passwordSalt: usmanCred.salt,
      role: 'WORKER',
      city: 'Rawalpindi',
      status: 'ACTIVE',
      createdAt: daysAgoIso(50),
      updatedAt: now,
    },
    ...v2.extraUsers,
  ];

  const assessorProfiles: AssessorProfileRecord[] = [
    {
      id: 'assessor_tariq',
      userId: 'user_assessor_tariq',
      approvalStatus: 'APPROVED',
      approvedTradeIds: [
        'trade_electrician',
        'trade_plumber',
        'trade_carpenter',
        'trade_ac_technician',
        'trade_beauty_parlour',
        'trade_appliance',
        'trade_mechanic',
      ],
      appliedTradeIds: ['trade_electrician', 'trade_plumber', 'trade_ac_technician'],
      yearsExperience: 14,
      qualifications: 'Senior Electrical & Technical Supervisor, DAE Electrical Technology, 14 years switchgear & home safety inspection.',
      bio: 'Lead technical assessor reviewing practical home-service competencies across Pakistan.',
      rejectionReason: '',
      appliedAt: daysAgoIso(215),
      reviewedAt: daysAgoIso(210),
      createdAt: daysAgoIso(220),
      updatedAt: now,
    },
    {
      id: 'assessor_kamran',
      userId: 'user_assessor_kamran',
      approvalStatus: 'PENDING',
      approvedTradeIds: [],
      appliedTradeIds: ['trade_carpenter'],
      yearsExperience: 11,
      qualifications: 'Master Woodworker & Workshop Instructor (11 years furniture joinery and safety supervision).',
      bio: 'Applying to verify carpentry measuring, joinery, and workshop safety competencies.',
      rejectionReason: '',
      appliedAt: daysAgoIso(2),
      reviewedAt: null,
      createdAt: daysAgoIso(3),
      updatedAt: now,
    },
  ];

  const employerProfiles: EmployerProfileRecord[] = [
    {
      id: 'employer_sana',
      userId: 'user_employer_sana',
      accountType: 'BUSINESS',
      companyName: 'Margalla Facilities & Engineering Services',
      industry: 'Building Maintenance & Contracting',
      city: 'Islamabad',
      website: 'https://margallafacilities.example.pk',
      description: 'Commercial and residential facility maintenance contractor hiring verified electricians, carpenters, and technicians across Islamabad & Lahore.',
      createdAt: daysAgoIso(190),
      updatedAt: now,
    },
    ...v2.extraEmployers,
  ];

  const workerProfiles: WorkerProfileRecord[] = [
    {
      id: 'worker_bilal',
      userId: 'user_worker_bilal',
      publicId: 'bilal-ahmed-elec',
      passportId: 'KC-PASS-BILAL1',
      selectedTradeId: 'trade_electrician',
      yearsExperience: 5,
      bio: 'Practical residential & small-office electrician experienced in 3-phase distribution board dressing, earthing checks, and clean conduit wiring.',
      skills: ['Distribution Board Setup', 'PVC Conduit Wiring', 'Multimeter Fault Tracing', 'RCCB Protection'],
      certificates: [{ title: 'Safety Wiring Workshop Attendance', issuer: 'Rawalpindi Technical Training Center', year: '2024' }],
      showCertificates: true,
      avatarUrl: '/images/trade_electrician_1795340853927.jpg',
      isPublic: true,
      isFemaleProfessional: false,
      tier: 'GOLD',
      tierStatus: 'ACTIVE',
      tierIssuedAt: daysAgoIso(10),
      tierExpiresAt: daysFromNowIso(355),
      tierUnderReview: false,
      createdAt: daysAgoIso(210),
      updatedAt: now,
    },
    {
      id: 'worker_nadia',
      userId: 'user_worker_nadia',
      publicId: 'nadia-hussain-carp',
      passportId: 'KC-PASS-NADIA2',
      selectedTradeId: 'trade_carpenter',
      yearsExperience: 6,
      bio: 'Custom cabinetry and solid hardwood joinery craftsperson specializing in mortise-and-tenon doors and modular kitchen assembly.',
      skills: ['Hardwood Joinery', 'Cabinet Installation', 'Precision Layout', 'Hand & Power Planing'],
      certificates: [],
      showCertificates: true,
      avatarUrl: '/images/avatar_bilal_1795340853872.jpg',
      isPublic: true,
      isFemaleProfessional: true,
      tier: 'SILVER',
      tierStatus: 'ACTIVE',
      tierIssuedAt: daysAgoIso(12),
      tierExpiresAt: daysFromNowIso(353),
      tierUnderReview: false,
      createdAt: daysAgoIso(125),
      updatedAt: now,
    },
    {
      id: 'worker_usman',
      userId: 'user_worker_usman',
      publicId: 'usman-raza-mech',
      passportId: 'KC-PASS-USMAN3',
      selectedTradeId: 'trade_mechanic',
      yearsExperience: 7,
      bio: 'Automotive technician focused on brake inspections, preventive engine servicing, and OBD-II diagnostics.',
      skills: ['Brake Rotor & Pad Service', 'OBD-II Scanning', 'Preventive Maintenance', 'Torque Calibration'],
      certificates: [],
      showCertificates: true,
      avatarUrl: '/images/trade_mechanic_1795340854456.jpg',
      isPublic: true,
      isFemaleProfessional: false,
      tier: 'BRONZE',
      tierStatus: 'ACTIVE',
      tierIssuedAt: daysAgoIso(6),
      tierExpiresAt: daysFromNowIso(359),
      tierUnderReview: false,
      createdAt: daysAgoIso(50),
      updatedAt: now,
    },
    ...v2.extraWorkers,
  ];

  const evidence: EvidenceRecord[] = [
    {
      id: 'ev_bilal_safety_1',
      workerProfileId: 'worker_bilal',
      competencyId: 'comp_elec_safety',
      title: 'LOTO Tagging & Insulated Glove Voltage Test',
      description: 'Testing main isolator dead state with digital multimeter while wearing insulated gloves and safety glasses before servicing breaker.',
      fileType: 'IMAGE',
      mimeType: 'image/jpeg',
      fileSize: 245000,
      fileKey: 'seed_bilal_safety_1',
      seedAssetPath: '/images/hero_karigar_trades_1795340854886.jpg',
      originalName: 'loto-safety-check.jpg',
      status: 'APPROVED',
      createdAt: daysAgoIso(60),
      updatedAt: daysAgoIso(58),
    },
    {
      id: 'ev_bilal_wiring_1',
      workerProfileId: 'worker_bilal',
      competencyId: 'comp_elec_wiring',
      title: 'Single-Phase Conduit & Socket Circuit Panel',
      description: 'Color-coded 2.5mm copper phase/neutral/earth wiring routed through PVC conduit into labeled distribution terminals.',
      fileType: 'IMAGE',
      mimeType: 'image/jpeg',
      fileSize: 280000,
      fileKey: 'seed_bilal_wiring_1',
      seedAssetPath: '/images/trade_electrician_1795340853927.jpg',
      originalName: 'wiring-panel-demo.jpg',
      status: 'SUBMITTED',
      createdAt: daysAgoIso(2),
      updatedAt: daysAgoIso(1),
    },
  ];

  const assessmentRequests: AssessmentRequestRecord[] = [
    {
      id: 'req_bilal_safety',
      workerProfileId: 'worker_bilal',
      tradeId: 'trade_electrician',
      status: 'COMPLETED',
      requestedAt: daysAgoIso(65),
      completedAt: daysAgoIso(63),
      updatedAt: daysAgoIso(63),
    },
    {
      id: 'req_bilal_wiring',
      workerProfileId: 'worker_bilal',
      tradeId: 'trade_electrician',
      status: 'PENDING',
      requestedAt: daysAgoIso(1),
      completedAt: null,
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'req_nadia_measure',
      workerProfileId: 'worker_nadia',
      tradeId: 'trade_carpenter',
      status: 'COMPLETED',
      requestedAt: daysAgoIso(60),
      completedAt: daysAgoIso(58),
      updatedAt: daysAgoIso(58),
    },
    {
      id: 'req_usman_brakes',
      workerProfileId: 'worker_usman',
      tradeId: 'trade_mechanic',
      status: 'COMPLETED',
      requestedAt: daysAgoIso(20),
      completedAt: daysAgoIso(18),
      updatedAt: daysAgoIso(18),
    },
    ...v2.extraRequests,
  ];

  const assessmentItems: AssessmentItemRecord[] = [
    {
      id: 'item_bilal_safety',
      requestId: 'req_bilal_safety',
      competencyId: 'comp_elec_safety',
      assessorProfileId: 'assessor_tariq',
      status: 'VERIFIED',
      totalScore: 8,
      maxScore: 9,
      percentage: 88.9,
      level: 'ADVANCED',
      feedback: 'Clear PPE compliance, proper zero-energy check with meter, and tidy dry workspace.',
      assessedAt: daysAgoIso(63),
      isAppealed: false,
      appealReason: '',
      appealStatus: 'NONE',
      appealedFromItemId: null,
      createdAt: daysAgoIso(65),
      updatedAt: daysAgoIso(63),
    },
    {
      id: 'item_bilal_wiring',
      requestId: 'req_bilal_wiring',
      competencyId: 'comp_elec_wiring',
      assessorProfileId: null,
      status: 'PENDING',
      totalScore: 0,
      maxScore: 0,
      percentage: 0,
      level: null,
      feedback: '',
      assessedAt: null,
      isAppealed: false,
      appealReason: '',
      appealStatus: 'NONE',
      appealedFromItemId: null,
      createdAt: daysAgoIso(1),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'item_nadia_measure',
      requestId: 'req_nadia_measure',
      competencyId: 'comp_carp_measure',
      assessorProfileId: 'assessor_tariq',
      status: 'VERIFIED',
      totalScore: 7,
      maxScore: 9,
      percentage: 77.8,
      level: 'COMPETENT',
      feedback: 'Accurate layout lines and clean try-square referencing.',
      assessedAt: daysAgoIso(58),
      isAppealed: false,
      appealReason: '',
      appealStatus: 'NONE',
      appealedFromItemId: null,
      createdAt: daysAgoIso(60),
      updatedAt: daysAgoIso(58),
    },
    {
      id: 'item_usman_brakes',
      requestId: 'req_usman_brakes',
      competencyId: 'comp_mech_brakes',
      assessorProfileId: 'assessor_tariq',
      status: 'VERIFIED',
      totalScore: 8,
      maxScore: 9,
      percentage: 88.9,
      level: 'ADVANCED',
      feedback: 'Thorough caliper and rotor wear check with proper torque wrench verification.',
      assessedAt: daysAgoIso(18),
      isAppealed: false,
      appealReason: '',
      appealStatus: 'NONE',
      appealedFromItemId: null,
      createdAt: daysAgoIso(20),
      updatedAt: daysAgoIso(18),
    },
    ...v2.extraItems,
  ];

  const assessmentScores: AssessmentScoreRecord[] = [
    { id: 'score_bs_1', assessmentItemId: 'item_bilal_safety', criterionId: 'crit_es_1', score: 3, comment: 'Insulated gloves and glasses worn consistently.', createdAt: daysAgoIso(63) },
    { id: 'score_bs_2', assessmentItemId: 'item_bilal_safety', criterionId: 'crit_es_2', score: 3, comment: 'Multimeter zero-energy check clearly shown.', createdAt: daysAgoIso(63) },
    { id: 'score_bs_3', assessmentItemId: 'item_bilal_safety', criterionId: 'crit_es_3', score: 2, comment: 'Clean workspace and clear tagging.', createdAt: daysAgoIso(63) },
  ];

  const badges: BadgeRecord[] = [
    {
      id: 'badge_bilal_safety',
      workerProfileId: 'worker_bilal',
      competencyId: 'comp_elec_safety',
      tradeId: 'trade_electrician',
      assessmentItemId: 'item_bilal_safety',
      assessorProfileId: 'assessor_tariq',
      level: 'ADVANCED',
      issuedAt: daysAgoIso(63),
      expiresAt: daysFromNowIso(302),
      status: 'ACTIVE',
      createdAt: daysAgoIso(63),
      updatedAt: daysAgoIso(63),
    },
    {
      id: 'badge_nadia_measure',
      workerProfileId: 'worker_nadia',
      competencyId: 'comp_carp_measure',
      tradeId: 'trade_carpenter',
      assessmentItemId: 'item_nadia_measure',
      assessorProfileId: 'assessor_tariq',
      level: 'COMPETENT',
      issuedAt: daysAgoIso(58),
      expiresAt: daysFromNowIso(307),
      status: 'ACTIVE',
      createdAt: daysAgoIso(58),
      updatedAt: daysAgoIso(58),
    },
    {
      id: 'badge_usman_brakes',
      workerProfileId: 'worker_usman',
      competencyId: 'comp_mech_brakes',
      tradeId: 'trade_mechanic',
      assessmentItemId: 'item_usman_brakes',
      assessorProfileId: 'assessor_tariq',
      level: 'ADVANCED',
      issuedAt: daysAgoIso(18),
      expiresAt: daysFromNowIso(347),
      status: 'ACTIVE',
      createdAt: daysAgoIso(18),
      updatedAt: daysAgoIso(18),
    },
    ...v2.extraBadges,
  ];

  const auditLogs: AuditLogRecord[] = [
    {
      id: 'audit_1',
      actorUserId: 'user_admin_1',
      action: 'ASSESSOR_APPROVED',
      entityType: 'AssessorProfile',
      entityId: 'assessor_tariq',
      description: 'Approved Mr. Tariq Mahmood as authorized assessor.',
      createdAt: daysAgoIso(210),
    },
    {
      id: 'audit_2',
      actorUserId: 'user_assessor_tariq',
      action: 'ASSESSMENT_SUBMITTED',
      entityType: 'AssessmentItem',
      entityId: 'item_bilal_safety',
      description: 'Verified Electrical Safety Practices (Level 3 - Advanced) for Bilal Ahmed.',
      createdAt: daysAgoIso(63),
    },
    {
      id: 'audit_3',
      actorUserId: 'user_worker_bilal',
      action: 'VERIFICATION_REQUESTED',
      entityType: 'AssessmentRequest',
      entityId: 'req_bilal_wiring',
      description: 'Bilal Ahmed submitted Basic Electrical Wiring evidence for verification.',
      createdAt: daysAgoIso(1),
    },
    ...v2.extraAuditLogs,
  ];

  const notifications: NotificationRecord[] = [
    {
      id: 'notif_1',
      userId: 'user_worker_bilal',
      type: 'COMPETENCY_VERIFIED',
      title: 'Competency Verified: Electrical Safety Practices',
      message: 'Mr. Tariq Mahmood verified your Electrical Safety Practices competency at Level 3 — Advanced.',
      link: '/worker/badges',
      isRead: false,
      createdAt: daysAgoIso(5),
    },
    {
      id: 'notif_2',
      userId: 'user_assessor_tariq',
      type: 'NEW_VERIFICATION_REQUEST',
      title: 'New Assessment Request: Bilal Ahmed',
      message: 'Bilal Ahmed requested verification for Basic Electrical Wiring (Electrician).',
      link: '/assessor/queue/req_bilal_wiring',
      isRead: false,
      createdAt: daysAgoIso(1),
    },
    {
      id: 'notif_3',
      userId: 'user_admin_1',
      type: 'ASSESSOR_APPLICATION',
      title: 'New Assessor Application: Kamran Qureshi',
      message: 'Kamran Qureshi applied for Carpenter trade assessor approval.',
      link: '/admin/assessors',
      isRead: false,
      createdAt: daysAgoIso(2),
    },
    ...v2.extraNotifications,
  ];

  return {
    version: 2,
    settings: { lang: 'en', tierRules: DEFAULT_TIER_RULES },
    users,
    workerProfiles,
    employerProfiles,
    assessorProfiles,
    trades,
    competencies,
    rubricCriteria,
    evidence,
    assessmentRequests,
    assessmentItems,
    assessmentScores,
    badges,
    contactRequests: [],
    shortlists: [],
    reports: [],
    auditLogs,
    notifications,
    jobs: v2.jobs,
    reviews: v2.reviews,
    disputes: [],
    tierApplications: v2.tierApplications,
    earningsLogs: v2.earningsLogs,
  };
}
