import json
import urllib.parse as up
import requests

# with open('response.json', 'w') as f:
#     json.dump(r.json(), f)

with open('response.json', 'r') as f:
    r = json.load(f)

print(r)


print(r['Response']['View'][0]['Result'][0]['Location']['NavigationPosition'])
print(r['Response']['View'][0]['Result'][0]['Location']['Related'][0]['Location']['DisplayPosition'])


class HERE:

    def __init__(self):

        self.here = 'https://geocoder.api.here.com/6.2/geocode.json'
        self.app_id = '3peEKduvqXuYDzZZnj0g'
        self.app_code = 'uur4uqOEz0zJZZWRr1kg1w'
        self.additional_data = 'IncludeMicroPointAddresses,true;PreserveUnitDesignators,true'

    def find(self, address):

        payload = {'app_id': self.app_id, 'app_code': self.app_code, 'searchtext': up.quote_plus(address),
                   'country': 'USA', 'state': 'US:FL', 'additionaldata': self.additional_data}
        r = requests.get(self.here, params=payload)
        r.raise_for_status()
        results = r['Response']['View'][0]['Result']
        for result in results:
            relevance = result['Relevance']
            matchQuality = result['MatchQuality']
            if 'Related' in result:
                for related in result['Related']:
                    continue
            latlon = result['Location']['DisplayPosition']
            return_address = result['Address']





if __name__ == '__main__':

    addr = '2039 N Meridian Rd APT 139 Tallahassee FL 32303'

    h = HERE()


