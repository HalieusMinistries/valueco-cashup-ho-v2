export interface StoreConfig {
  code: string; name: string; bank: string; sp: string
  floats: number; change: number; addr: string
}

export const VCL_STORES: StoreConfig[] = [
  { code: 'VCL01', name: 'VCL Randburg', bank: '63168708932', sp: '00627792', floats: 5050, change: 9800, addr: 'Lifestyle Garden Centre, C/O Beyers Naude & Ysterhout Ave, Randpark Ridge, Randburg' },
  { code: 'VCL02', name: 'VCL Centurion', bank: '63168708015', sp: '00627479', floats: 5050, change: 5150.9, addr: 'Gateway Plaza, C/O Sarel Baard Ave & Old Johannesburg Rd, Rooihuiskraal, Centurion' },
  { code: 'VCL03', name: 'VCL Alberton', bank: '63168707364', sp: '00626349', floats: 5050, change: 4550, addr: 'Alberton Value Centre, 16 St Austell St, New Redruth, Alberton' },
  { code: 'VCL04', name: 'VCL Vaal', bank: '63168707281', sp: '00628725', floats: 3030, change: 5000, addr: 'President Vaal Square, C/O Playfair Blvd & Ascot on Vaal, Vanderbijlpark' },
  { code: 'VCL05', name: 'VCL Boksburg', bank: '63168707025', sp: '00628253', floats: 3030, change: 2000, addr: 'East Rand Value Mall, Rietfontein Rd, Hughes, Boksburg' },
  { code: 'VCL06', name: 'VCL Atterbury', bank: '63168708792', sp: '00627149', floats: 3030, change: 10450, addr: 'Atterbury Lifestyle Centre, C/O Atterbury & Windsor Rd, Pretoria' },
  { code: 'VCL07', name: 'VCL Secunda', bank: '63168708594', sp: '00629327', floats: 3030, change: 8450, addr: 'Secunda Value Centre, C/O PDP Kruger & Nelson Mandela Dr, Secunda' },
  { code: 'VCL08', name: 'VCL North Rand Square', bank: '63168707637', sp: '00630606', floats: 2020, change: 2810, addr: 'North Rand Square, C/O North Rand & Goodman Rd, Boksburg' },
  { code: 'VCL09', name: 'VCL Somerset West', bank: '63168706986', sp: '00629418', floats: 3030, change: 5300, addr: 'Somerset Value Mart, Somerset West, Western Cape' },
  { code: 'VCL10', name: 'VCL Blueberry', bank: '63168706861', sp: '00629442', floats: 3030, change: 5300, addr: 'Blueberry Square, C/O Beyers Naude Dr & Blueberry St, Honeydew' },
  { code: 'VCL12', name: 'VCL The Reef', bank: '63168706712', sp: '00629152', floats: 3030, change: 3000, addr: 'The Reef Shopping Centre, C/O Chris St & Black Reef Rd, Albermarle, Germiston' },
  { code: 'VCL15', name: 'VCL Ryneveld', bank: '63168707455', sp: '00629236', floats: 3030, change: 8450, addr: '75 Van Ryneveld Ave, Pierre van Ryneveld, Centurion' },
  { code: 'VCL16', name: 'VCL Horizon View', bank: '63168707174', sp: '00630366', floats: 2020, change: 5300, addr: 'Horizon Shopping Centre, 61 Sonop St, Horizon View, Roodepoort' },
  { code: 'VCL17', name: 'VCL Randfontein', bank: '63168707108', sp: '00630291', floats: 3030, change: 8450, addr: 'Umphakathi Mall, C/O Main Reef R28 & Main Rd, Randfontein' },
  { code: 'VCL18', name: 'VCL Harvest Place', bank: '63168707546', sp: '00631430', floats: 3030, change: 8500, addr: 'Harvest Place, C/O Monument Rd & Blaauwklippen Ave, Glen Marais, Kempton Park' },
  { code: 'VCL19', name: 'VCL Bethlehem', bank: '63168706457', sp: '00630861', floats: 3030, change: 5300, addr: 'Fauna Shopping Centre, 24 Muller St, Bethlehem, 9701' },
  { code: 'VCL20', name: 'VCL Lambton Gardens', bank: '63168708510', sp: '00630408', floats: 4040, change: 2400, addr: 'Lambton Gardens Retail Centre, C/O Webber & Beacon Rd, Germiston' },
  { code: 'VCL21', name: 'VCL Comaro Crossing', bank: '63168708172', sp: '00629822', floats: 3030, change: 4900, addr: 'Comaro Crossing, 32 Oak Ave, Linmeyer, Johannesburg' },
  { code: 'VCL22', name: 'VCL Rand Steam', bank: '63168707736', sp: '00631711', floats: 3030, change: 5300, addr: 'Rand Steam Centre, C/O Napier & Barry Hertzog Ave, Richmond' },
  { code: 'VCL23', name: 'VCL Waterfall Ridge', bank: '63168708669', sp: '00630150', floats: 5050, change: 4000, addr: 'Waterfall Ridge Centre, C/O Ridge & Pretorius Rd, Vorna Valley, Midrand' },
  { code: 'VCL24', name: 'VCL Wavecrest - Test', bank: '', sp: '', floats: 2020, change: 5300, addr: 'Test Store' },
]

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']