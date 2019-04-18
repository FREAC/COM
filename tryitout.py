import HERE

path = r'D:\Projects\CPP\CPEIP_GeoMap.csv'

HERE.Geocoder(path, outfile='CPP.csv', fields=['address', 'city', 'state', 'zip'], fl=True)



# for address in addresses.data[:6]:
#     print(address)
# #     g.find(address)

# g.find('Suite 610 415 N McKinley Street Little Rock AR 72205')
