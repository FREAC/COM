import json
import urllib.parse as up
import requests

here = 'https://geocoder.api.here.com/6.2/geocode.json'
app_id = '3peEKduvqXuYDzZZnj0g'
app_code = 'uur4uqOEz0zJZZWRr1kg1w'

additional_data = 'IncludeMicroPointAddresses,true;PreserveUnitDesignators,true'
address = '2039 N Meridian Rd APT 139 Tallahassee FL 32303'
payload = {'app_id': app_id, 'app_code': app_code, 'searchtext': up.quote_plus(address),
           'country': 'USA', 'state': 'US:FL', 'additionaldata': additional_data}

# r = requests.get(here, params=payload)
# print(r.status_code)
# print(r.url)
#
# with open('response.json', 'w') as f:
#     json.dump(r.json(), f)

with open('response.json', 'r') as f:
    r = json.load(f)

print(r)
print(len(r['Response']['View'][0]['Result']))
print(r['Response']['View'][0]['Result'][0]['Location']['NavigationPosition'])
print(r['Response']['View'][0]['Result'][0]['Location']['Related'][0]['Location']['DisplayPosition'])

