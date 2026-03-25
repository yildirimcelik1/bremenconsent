export const COUNTRIES = [
  'Deutschland', 'Österreich', 'Schweiz', 'Türkei', 'Niederlande', 'Belgien',
  'Frankreich', 'Italien', 'Spanien', 'Polen', 'Vereinigtes Königreich', 'Vereinigte Staaten', 'Sonstiges',
];

export const COUNTRY_CITIES: Record<string, string[]> = {
  Germany: [
    'Bremen', 'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart',
    'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Dresden', 'Hanover', 'Nuremberg',
    'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Mannheim',
    'Karlsruhe', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach',
    'Braunschweig', 'Kiel', 'Chemnitz', 'Aachen', 'Halle', 'Magdeburg', 'Freiburg',
    'Krefeld', 'Lübeck', 'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel',
    'Hagen', 'Saarbrücken', 'Hamm', 'Potsdam', 'Ludwigshafen', 'Oldenburg',
    'Leverkusen', 'Osnabrück', 'Solingen', 'Heidelberg', 'Darmstadt', 'Paderborn',
    'Regensburg', 'Ingolstadt', 'Würzburg', 'Wolfsburg', 'Ulm', 'Göttingen',
    'Offenbach', 'Pforzheim', 'Recklinghausen', 'Bottrop', 'Trier', 'Bremerhaven',
    'Reutlingen', 'Koblenz', 'Jena', 'Erlangen', 'Remscheid', 'Heilbronn',
  ],
  Austria: [
    'Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach',
    'Wels', 'St. Pölten', 'Dornbirn', 'Wiener Neustadt', 'Steyr', 'Feldkirch',
    'Bregenz', 'Leonding', 'Klosterneuburg', 'Baden', 'Wolfsberg', 'Leoben',
    'Krems', 'Traun', 'Amstetten', 'Lustenau', 'Kapfenberg', 'Mödling',
    'Hallein', 'Kufstein', 'Braunau', 'Schwechat', 'Stockerau',
  ],
  Switzerland: [
    'Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne',
    'St. Gallen', 'Lugano', 'Biel/Bienne', 'Thun', 'Köniz', 'La Chaux-de-Fonds',
    'Schaffhausen', 'Fribourg', 'Chur', 'Neuchâtel', 'Vernier', 'Uster', 'Sion',
    'Lancy', 'Emmen', 'Yverdon', 'Kriens', 'Rapperswil-Jona', 'Zug', 'Dübendorf',
    'Montreux', 'Dietikon', 'Frauenfeld',
  ],
  Turkey: [
    'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep',
    'Konya', 'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Samsun',
    'Denizli', 'Şanlıurfa', 'Malatya', 'Kahramanmaraş', 'Erzurum', 'Van',
    'Batman', 'Elazığ', 'Manisa', 'Trabzon', 'Gebze', 'Sivas', 'Tarsus',
    'Kocaeli', 'Balıkesir', 'Aydın', 'Tekirdağ', 'Ordu', 'Çorum', 'Aksaray',
    'Afyon', 'Hatay', 'Edirne', 'Muğla', 'Bolu', 'Sakarya', 'Düzce',
    'Bodrum', 'Alanya', 'Marmaris', 'Kuşadası', 'Fethiye', 'Çanakkale',
    'Rize', 'Tokat', 'Kırklareli', 'Sinop', 'Artvin', 'Giresun', 'Kastamonu',
    'Nevşehir', 'Niğde', 'Kırşehir', 'Yozgat', 'Bitlis', 'Muş', 'Hakkari',
    'Şırnak', 'Siirt', 'Bingöl', 'Tunceli', 'Iğdır', 'Kars', 'Ağrı',
    'Ardahan', 'Bayburt', 'Gümüşhane', 'Bartın', 'Karabük', 'Zonguldak',
    'Amasya', 'Çankırı', 'Bilecik', 'Kütahya', 'Uşak', 'Isparta', 'Burdur',
    'Karaman', 'Kırıkkale', 'Osmaniye', 'Adıyaman', 'Mardin', 'Yalova',
  ],
  Netherlands: [
    'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen',
    'Tilburg', 'Almere', 'Breda', 'Nijmegen', 'Arnhem', 'Haarlem', 'Enschede',
    'Haarlemmermeer', 'Zaanstad', 'Amersfoort', "'s-Hertogenbosch", 'Apeldoorn',
    'Zwolle', 'Maastricht', 'Leiden', 'Dordrecht', 'Zoetermeer', 'Leeuwarden',
    'Emmen', 'Westland', 'Alphen aan den Rijn', 'Ede', 'Delft', 'Deventer',
    'Alkmaar', 'Heerlen', 'Venlo', 'Hilversum', 'Oss', 'Roosendaal',
  ],
  Belgium: [
    'Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur',
    'Leuven', 'Mons', 'Mechelen', 'Aalst', 'La Louvière', 'Hasselt', 'Kortrijk',
    'Sint-Niklaas', 'Ostend', 'Tournai', 'Genk', 'Seraing', 'Roeselare',
    'Mouscron', 'Verviers', 'Dendermonde', 'Beringen', 'Turnhout', 'Waregem',
  ],
  France: [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg',
    'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne',
    'Toulon', 'Le Havre', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne',
    'Clermont-Ferrand', 'Le Mans', 'Aix-en-Provence', 'Brest', 'Tours',
    'Amiens', 'Limoges', 'Perpignan', 'Metz', 'Besançon', 'Orléans',
    'Rouen', 'Mulhouse', 'Caen', 'Nancy', 'Argenteuil', 'Montreuil',
    'Saint-Denis', 'Avignon', 'Poitiers', 'Cannes', 'Antibes', 'Versailles',
  ],
  Italy: [
    'Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna',
    'Florence', 'Bari', 'Catania', 'Venice', 'Verona', 'Messina', 'Padua',
    'Trieste', 'Brescia', 'Taranto', 'Prato', 'Parma', 'Modena', 'Reggio Calabria',
    'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia',
    'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Latina', 'Monza', 'Syracuse',
    'Bergamo', 'Pescara', 'Trento', 'Forlì', 'Vicenza', 'Terni', 'Bolzano',
    'Novara', 'Piacenza', 'Ancona', 'Lecce', 'Udine', 'La Spezia', 'Arezzo',
  ],
  Spain: [
    'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia',
    'Palma de Mallorca', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid',
    'Vigo', 'Gijón', "L'Hospitalet", 'Vitoria-Gasteiz', 'A Coruña', 'Granada',
    'Elche', 'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez de la Frontera',
    'Sabadell', 'Móstoles', 'Santa Cruz de Tenerife', 'Pamplona', 'Almería',
    'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'San Sebastián', 'Getafe',
    'Burgos', 'Albacete', 'Santander', 'Castellón', 'Alcorcón', 'San Cristóbal',
    'Logroño', 'Badajoz', 'Salamanca', 'Huelva', 'Marbella', 'Tarragona',
    'León', 'Cádiz', 'Lleida', 'Jaén', 'Ourense', 'Lugo', 'Girona', 'Toledo',
    'Torrejón de Ardoz', 'Reus', 'Mataró', 'Torrevieja', 'Benidorm',
  ],
  Poland: [
    'Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin',
    'Bydgoszcz', 'Lublin', 'Białystok', 'Katowice', 'Gdynia', 'Częstochowa',
    'Radom', 'Toruń', 'Sosnowiec', 'Rzeszów', 'Kielce', 'Gliwice', 'Olsztyn',
    'Zabrze', 'Bielsko-Biała', 'Bytom', 'Zielona Góra', 'Rybnik', 'Ruda Śląska',
    'Opole', 'Tychy', 'Gorzów Wielkopolski', 'Elbląg', 'Płock', 'Dąbrowa Górnicza',
    'Wałbrzych', 'Włocławek', 'Tarnów', 'Chorzów', 'Koszalin', 'Kalisz', 'Legnica',
  ],
  'United Kingdom': [
    'London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Liverpool',
    'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester', 'Coventry',
    'Nottingham', 'Kingston upon Hull', 'Bradford', 'Cardiff', 'Belfast',
    'Stoke-on-Trent', 'Wolverhampton', 'Plymouth', 'Southampton', 'Reading',
    'Derby', 'Dudley', 'Northampton', 'Portsmouth', 'Luton', 'Preston',
    'Aberdeen', 'Milton Keynes', 'Sunderland', 'Norwich', 'Swansea', 'Oxford',
    'Cambridge', 'York', 'Gloucester', 'Bath', 'Exeter', 'Brighton', 'Canterbury',
    'Dundee', 'Inverness', 'Stirling', 'Cheltenham', 'Chester', 'Ipswich',
    'Middlesbrough', 'Blackpool', 'Bolton', 'Bournemouth', 'Peterborough',
  ],
  'United States': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'Indianapolis', 'San Francisco',
    'Seattle', 'Denver', 'Washington D.C.', 'Nashville', 'Oklahoma City',
    'El Paso', 'Boston', 'Portland', 'Las Vegas', 'Memphis', 'Louisville',
    'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Mesa',
    'Sacramento', 'Atlanta', 'Kansas City', 'Colorado Springs', 'Omaha',
    'Raleigh', 'Long Beach', 'Virginia Beach', 'Miami', 'Oakland', 'Minneapolis',
    'Tulsa', 'Tampa', 'Arlington', 'New Orleans', 'Cleveland', 'Honolulu',
    'Bakersfield', 'Aurora', 'Anaheim', 'Santa Ana', 'Riverside', 'St. Louis',
    'Pittsburgh', 'Cincinnati', 'Orlando', 'Detroit',
  ],
};

export const TATTOO_PLACEMENTS = [
  'Arm', 'Unterarm', 'Oberarm', 'Schulter', 'Rücken', 'Brust',
  'Bauch', 'Hüfte', 'Bein', 'Oberschenkel', 'Wade', 'Fuß / Knöchel',
  'Hand / Finger', 'Nacken', 'Gesicht', 'Lippen', 'Sonstiges',
] as const;

export const PIERCING_TYPES = [
  'Ohrläppchen', 'Helix', 'Tragus', 'Conch', 'Daith', 'Rook', 'Industrial',
  'Nase (Nostril)', 'Septum', 'Bridge', 'Augenbraue', 'Lippe (Labret)',
  'Monroe / Madonna', 'Medusa (Philtrum)', 'Snake Bites', 'Zunge',
  'Smiley', 'Bauchnabel', 'Brustwarze', 'Oberflächenpiercing', 'Dermal / Microdermal',
  'Sonstiges',
] as const;

export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function generateYears() {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= current - 100; y--) {
    years.push(y);
  }
  return years;
}

export function generateDays() {
  return Array.from({ length: 31 }, (_, i) => i + 1);
}
