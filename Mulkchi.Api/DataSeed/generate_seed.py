import re

def region_enum(r):
    r = r.lower()
    if 'toshkent sh' in r: return 'UzbekistanRegion.ToshkentShahar'
    if 'toshkent vil' in r: return 'UzbekistanRegion.ToshkentViloyat'
    if 'samarqand' in r: return 'UzbekistanRegion.Samarqand'
    if 'buxoro' in r: return 'UzbekistanRegion.Buxoro'
    if 'xorazm' in r: return 'UzbekistanRegion.Xorazm'
    if 'namangan' in r: return 'UzbekistanRegion.Namangan'
    if 'farg\'ona' in r: return 'UzbekistanRegion.Fargona'
    if 'qashqadaryo' in r: return 'UzbekistanRegion.Qashqadaryo'
    if 'surxondaryo' in r: return 'UzbekistanRegion.Surxondaryo'
    if 'andijon' in r: return 'UzbekistanRegion.Andijon'
    if 'jizzax' in r: return 'UzbekistanRegion.Jizzax'
    if 'sirdaryo' in r: return 'UzbekistanRegion.Sirdaryo'
    if 'navoiy' in r: return 'UzbekistanRegion.Navoiy'
    if 'qoraqalpog\'iston' in r: return 'UzbekistanRegion.Qoraqalpogiston'
    return 'UzbekistanRegion.ToshkentShahar'

def listing_enum(l):
    if 'Sotish' in l: return 'ListingType.Sale'
    if 'Ijara' in l: return 'ListingType.Rent'
    if 'Kunlik' in l: return 'ListingType.ShortTermRent'
    return 'ListingType.Sale'

def building_enum(b):
    if 'Yangi' in b: return 'BuildingType.NewBuilding'
    return 'BuildingType.OldBuilding'

def reno_enum(r):
    if 'Lyuks' in r or 'Yevro' in r: return 'RenovationLevel.EuroLux'
    if 'Korobka' in r or 'Ta\'mirtalab' in r: return 'RenovationLevel.ShellAndCore'
    return 'RenovationLevel.Average'

with open('real_properties.csv', 'r', encoding='utf-8') as f:
    lines = f.read().strip().split('\n')[1:]

csharp_lines = []
for line in lines:
    cols = line.split('|')
    if len(cols) < 10: continue
    
    reg = region_enum(cols[1])
    city = cols[1]
    dist = cols[2].replace("sh.", "").replace("t.", "").strip()
    lt = listing_enum(cols[3])
    area = cols[5]
    beds = cols[6]
    bldg = building_enum(cols[7])
    reno = reno_enum(cols[8])
    price = cols[9].replace("$", "").replace(",", "")
    
    title = f"{dist}da {beds} xonali {bldg.replace('BuildingType.','')} uy"
    
    csharp_lines.append(f'            new {{ Region = {reg}, City = "{city}", District = "{dist}", Type = PropertyType.Apartment, ListingType = {lt}, Price = {price}m, Area = {area}, Beds = {beds}, Baths = 1, BuildingType = {bldg}, RenovationLevel = {reno}, Title = "{title}", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 }},')

csharp_code = "        var realListings = new[]\n        {\n" + "\n".join(csharp_lines) + "\n        };\n"

with open('DevelopmentDataSeeder.cs', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace between "var realListings = new[]" and "string[] validUnsplashIds"
start_idx = content.find("var realListings = new[]")
end_idx = content.find("string[] validUnsplashIds")

new_content = content[:start_idx] + csharp_code + "\n        " + content[end_idx:]

# Also replace NewTargetPropertyCount = 70 with 100
new_content = new_content.replace("const int NewTargetPropertyCount = 70;", "const int NewTargetPropertyCount = 100;")

# Modify properties.Add to map BuildingType and RenovationLevel
add_prop_start = new_content.find("properties.Add(new Property")
add_prop_end = new_content.find("Currency = Currency.UZS", add_prop_start)

replacement_str = """
                BuildingType = template.BuildingType,
                RenovationLevel = template.RenovationLevel,
                Currency = Currency.USD,
"""

new_content = new_content.replace("Currency = Currency.UZS,", replacement_str.strip() + ",")
new_content = new_content.replace("IsRenovated = i % 4 != 0,", "IsRenovated = template.RenovationLevel != RenovationLevel.ShellAndCore,")

with open('DevelopmentDataSeeder.cs', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done generating C# code and updating DevelopmentDataSeeder.cs.")
