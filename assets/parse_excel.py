import zipfile
import xml.etree.ElementTree as ET

z = zipfile.ZipFile('lugares_casas_grandes 2.xlsx')
sst = []
if 'xl/sharedStrings.xml' in z.namelist():
    sroot = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in sroot.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
        sst.append(''.join(t.text for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text))

sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
rows = sheet.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
for r in rows:
    row_num = r.attrib.get('r')
    vals = {}
    for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
        ref = c.attrib.get('r')
        col = ''.join(filter(str.isalpha, ref))
        t = c.attrib.get('t')
        v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
        is_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
        val = ''
        if is_elem is not None and is_elem.text:
            val = is_elem.text
        elif v is not None and v.text:
            if t == 's':
                val = sst[int(v.text)]
            else:
                val = v.text
        vals[col] = val
    print(f"Row {row_num}: {vals.get('A', '')} | {vals.get('B', '')} | {vals.get('C', '')} | {vals.get('D', '')} | {vals.get('E', '')}")
