import urllib.parse as up
import webbrowser
import sqlite3
import requests


class HERE:

    def __init__(self, db_name=None):

        self.here = 'https://geocoder.api.here.com/6.2/geocode.json'
        self.app_id = '3peEKduvqXuYDzZZnj0g'
        self.app_code = 'uur4uqOEz0zJZZWRr1kg1w'
        self.additional_data = 'IncludeMicroPointAddresses,true;PreserveUnitDesignators,true'
        # if db_name:
        #     self.con = sqlite3.connect(db_name)
        # else:
        #     self.con = sqlite3.connect('FSUCOM.db')
        #
        # self.con.execute('''CREATE TABLE address
        #                     (''')

    def find(self, address, web=True):

        google_url = 'https://www.google.com/maps/search/?api=1&query={}'
        results = self.geocode_results(address)

        for result in results:
            print(result)
            print()
            print('Main result:', result['Location']['Address']['Label'])
            if web:
                latlon = '{Latitude},{Longitude}'.format(**result['Location']['DisplayPosition'])
                webbrowser.open(google_url.format(latlon), new=2)
            print('Relevance:', result['Relevance'])
            print('Match Quality: {}'.format(result['MatchQuality']))
            if 'Related' in result['Location']:
                for related in result['Location']['Related']:
                    print('-' * 20)
                    print('Related result:', related['Location']['Address']['Label'])
                    if web:
                        latlon = '{Latitude},{Longitude}'.format(**related['Location']['DisplayPosition'])
                        webbrowser.open(google_url.format(latlon), new=2)

    def geocode_results(self, address):

        payload = {'app_id': self.app_id, 'app_code': self.app_code, 'searchtext': up.quote_plus(address),
                   'country': 'USA', 'state': 'US:FL', 'additionaldata': self.additional_data}
        r = requests.get(self.here, params=payload)
        r.raise_for_status()
        jsr = r.json()

        return jsr['Response']['View'][0]['Result']


if __name__ == '__main__':

    addr = '2039 N Meridian Rd APT 139 Tallahassee FL 32303'
    addr = '296 CHampions Way, Tallahassee, Florida 32306-2641'

    h = HERE()
    h.find(addr)


