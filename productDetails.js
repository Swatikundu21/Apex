const catalog = {
  p1: {
    delivery_days: 2,
    warranty: '2-year limited hardware warranty. Battery covered for 12 months.',
    return_policy: '30-day returns. Exchange unused items within 14 days with original packaging.',
    specifications: [
      ['Case', 'Grade 5 titanium, 49mm'],
      ['Display', 'Always-on LTPO OLED'],
      ['Battery', 'Up to 7 days typical use'],
      ['Water resistance', '100m'],
      ['Connectivity', 'GPS + LTE, Bluetooth 5.3']
    ]
  },
  p2: {
    delivery_days: 3,
    warranty: '18-month limited warranty covering drivers and ANC hardware.',
    return_policy: '30-day returns if ear cushions and serial labels are intact.',
    specifications: [
      ['Drivers', '40mm dynamic, studio-tuned'],
      ['ANC', 'Adaptive hybrid noise canceling'],
      ['Battery', '40 hours with ANC on'],
      ['Connectivity', 'Bluetooth 5.3, USB-C audio'],
      ['Weight', '250g']
    ]
  },
  p3: {
    delivery_days: 5,
    warranty: '3-year limited hardware warranty with 1-year accidental damage option.',
    return_policy: '14-day returns. Opened software licenses are non-refundable.',
    specifications: [
      ['Chip', 'Apex Silicon M3 12-core'],
      ['Display', '15.2-inch Liquid Retina, 120Hz'],
      ['Memory', '32GB unified'],
      ['Storage', '1TB SSD'],
      ['Ports', '3× USB-C / Thunderbolt, HDMI, MagSafe']
    ]
  },
  p4: {
    delivery_days: 2,
    warranty: '1-year limited warranty on charging coil and stand.',
    return_policy: '30-day returns. Cables must be unused and resealable.',
    specifications: [
      ['Charging', '15W MagSafe + watch + earbuds'],
      ['Input', 'USB-C PD 30W'],
      ['Stand', 'Weighted aluminum'],
      ['Compatibility', 'Qi phones, Apex Watch, Apex Pulse']
    ]
  },
  p5: {
    delivery_days: 2,
    warranty: '1-year limited warranty. Sweat and water damage covered for sports use.',
    return_policy: '30-day returns with unused ear tips included.',
    specifications: [
      ['ANC', 'Adaptive with transparency mode'],
      ['Battery', '8 hours + 24 in case'],
      ['Water', 'IPX4'],
      ['Charging', 'USB-C, wireless case']
    ]
  },
  p6: {
    delivery_days: 3,
    warranty: '2-year limited warranty on sensor and microphones.',
    return_policy: '30-day returns. Privacy shutter must function as new.',
    specifications: [
      ['Sensor', '4K 30fps, 1080p 60fps'],
      ['Framing', 'Auto-frame and desk mode'],
      ['Audio', 'Dual beamforming mics'],
      ['Mount', 'Monitor clip + 1/4-20']
    ]
  },
  p7: {
    delivery_days: 4,
    warranty: '2-year limited warranty. Hot-swap sockets covered for 12 months.',
    return_policy: '30-day returns if keycaps are complete and unlubricated aftermarket.',
    specifications: [
      ['Layout', '75% ANSI'],
      ['Switches', 'Hot-swap tactile'],
      ['Frame', 'CNC aluminum'],
      ['Lighting', 'Per-key RGB'],
      ['Connection', 'USB-C, 2.4GHz, Bluetooth']
    ]
  },
  p8: {
    delivery_days: 6,
    warranty: '3-year panel warranty including dead-pixel coverage (3+ bright).',
    return_policy: '14-day returns. Screen must be free of pressure marks.',
    specifications: [
      ['Size', '34-inch ultrawide'],
      ['Resolution', '3440 × 1440 @ 144Hz'],
      ['Panel', 'IPS, HDR400'],
      ['USB-C', '90W power delivery'],
      ['Stand', 'Height, tilt, swivel']
    ]
  },
  p9: {
    delivery_days: 3,
    warranty: '2-year warranty on zippers, seams, and weather coating.',
    return_policy: '30-day returns if unused and tags attached.',
    specifications: [
      ['Volume', '22L'],
      ['Laptop sleeve', 'Up to 16-inch'],
      ['Material', 'Weatherproof recycled nylon'],
      ['Security', 'RFID pocket, lockable zippers']
    ]
  },
  p10: {
    delivery_days: 2,
    warranty: '1-year limited warranty. Band is replaceable and excluded after wear.',
    return_policy: '30-day returns. Skin-contact items must be sanitized.',
    specifications: [
      ['Sensors', 'Heart rate, SpO2, sleep'],
      ['Battery', '10 days typical'],
      ['Water', '5 ATM'],
      ['Display', 'AMOLED 1.8-inch']
    ]
  },
  p11: {
    delivery_days: 4,
    warranty: '2-year limited hardware warranty. Stylus tip wear is excluded.',
    return_policy: '14-day returns. Screen protector may stay installed.',
    specifications: [
      ['Display', '12.9-inch OLED, 120Hz'],
      ['Chip', 'Apex Silicon M2'],
      ['Storage', '256GB'],
      ['Pencil', 'Included Apex Stylus'],
      ['Cellular', 'Wi-Fi 6E']
    ]
  },
  p12: {
    delivery_days: 3,
    warranty: '2-year limited warranty on ports and power delivery.',
    return_policy: '30-day returns with all cables included.',
    specifications: [
      ['Video', 'Dual 4K 60Hz'],
      ['Network', '2.5G ethernet'],
      ['Power', '100W pass-through'],
      ['Ports', '12 total including SD and 3.5mm']
    ]
  },
  p13: {
    delivery_days: 3,
    warranty: '2-year limited warranty on capsule and mute hardware.',
    return_policy: '30-day returns. Pop filter must be unused.',
    specifications: [
      ['Type', 'USB condenser, cardioid'],
      ['Controls', 'Hardware mute and gain'],
      ['Sample rate', '24-bit / 96kHz'],
      ['Mount', 'Desktop stand included']
    ]
  },
  p14: {
    delivery_days: 2,
    warranty: '2-year limited warranty. Skates are considered consumable.',
    return_policy: '30-day returns if feet and sensor lens are undamaged.',
    specifications: [
      ['Sensor', '26K DPI optical'],
      ['Battery', '70 hours wireless'],
      ['Weight', '63g'],
      ['Feet', 'PTFE skates']
    ]
  },
  p15: {
    delivery_days: 4,
    warranty: '1-year limited warranty. Privacy shutter covered for the full term.',
    return_policy: '30-day returns. Hub must be unpaired from the account.',
    specifications: [
      ['Radios', 'Thread, Matter, Wi-Fi 6'],
      ['Sensors', 'Temp, humidity, occupancy'],
      ['Privacy', 'Physical camera shutter'],
      ['Power', 'USB-C 15W']
    ]
  },
  p16: {
    delivery_days: 2,
    warranty: '18-month limited warranty on cells and PD circuitry.',
    return_policy: '30-day returns if capacity label is intact.',
    specifications: [
      ['Capacity', '27,000 mAh'],
      ['Output', '2× USB-C PD, 1× USB-A'],
      ['Laptop', 'Up to 100W burst'],
      ['Weight', '620g']
    ]
  }
};

const fallback = {
  delivery_days: 4,
  warranty: '1-year limited manufacturer warranty.',
  return_policy: '30-day returns on unused items with original packaging. Exchanges within 14 days.',
  specifications: [
    ['Origin', 'ApexCart fulfillment'],
    ['Support', 'Enterprise chat and email']
  ]
};

function detailsFor(id) {
  return catalog[id] || fallback;
}

module.exports = { catalog, fallback, detailsFor };
