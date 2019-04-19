import HERE

d = r'D:/Projects/CPP/'
inpath = d + 'CPEIP_GeoMap.csv'
outpath = d + 'Results.csv'

# HERE.Geocoder(inpath, outfile=outpath, fields=['address', 'city', 'state', 'zip'], fl=True)

HERE.clean_csv(inpath, d + 'test.csv')

x = ['first_name', 'last_name', 'agency', 'address', 'city', 'state', 'zip', 'phone', 'service', 'Longitude', 'Latitude']
HERE.csv2json(r'D:\Projects\CPP\test.csv', r'D:\Projects\CPP\CPP.json', fields=x)
