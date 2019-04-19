import HERE

d = r'D:/Projects/CPP/'
inpath = d + 'CPEIP_GeoMap.csv'
outpath = d + 'Results.csv'

# HERE.Geocoder(inpath, outfile=outpath, fields=['address', 'city', 'state', 'zip'], fl=True)



# for address in addresses.data[:6]:
#     print(address)
# #     g.find(address)

# g.find('Suite 610 415 N McKinley Street Little Rock AR 72205')

x = ['first_name', 'last_name', 'agency', 'address', 'city', 'state', 'zip', 'phone', 'service', 'Longitude', 'Latitude']

HERE.csv2json(r'D:\Projects\CPP\test.csv', r'D:\Projects\CPP\CPP.json', fields=x)

# HERE.clean_csv(inpath, d + 'test.csv')