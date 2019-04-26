import HERE

# d = r'D:/Projects/CPP/raw_data/'
# inpath = d + 'CPEIP_GeoMap.csv'
# outpath = d + 'Results.csv'

inpath = 'MMHDP.csv'
outpath = 'trouble3.csv'


HERE.Geocoder(inpath, outfile=outpath, key='agency/Provider Name')

# HERE.clean_csv(inpath, d + 'test.csv')

x = ['first_name', 'last_name', 'agency', 'address', 'city', 'state', 'zip', 'phone', 'service', 'Longitude', 'Latitude']
# HERE.csv2json(r'D:\Projects\CPP\raw_data\test.csv', r'D:\Projects\CPP\raw_data\CPP.json', fields=x)
