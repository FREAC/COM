import pyodbc
import urllib.parse as parse
import webbrowser
import re

import requests


class HERE:

    def __init__(self):

        self.app_id = '3peEKduvqXuYDzZZnj0g'
        self.app_code = 'uur4uqOEz0zJZZWRr1kg1w'
        self.additional_data = 'IncludeMicroPointAddresses,true;PreserveUnitDesignators,true'

    def find(self, data, web=True):

            results = self.geocode_string(data)
            google_url = 'https://www.google.com/maps/search/?api=1&query={}'

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

    def geocode_string(self, address):

        here = 'https://geocoder.api.here.com/6.2/geocode.json'
        payload = {'app_id': self.app_id, 'app_code': self.app_code, 'additionaldata': self.additional_data,
                   'searchtext': parse.quote_plus(address), 'country': 'USA', 'state': 'US:FL'}

        r = requests.get(here, params=payload)
        r.raise_for_status()
        jsr = r.json()

        return jsr['Response']['View'][0]['Result']


class Access:

    def __init__(self):

        self.mdb_path = r'D:\Projects\COM\Address_Test.mdb'
        self.conn = pyodbc.connect(r'Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={};'.format(self.mdb_path))

    def get_data(self):

        data = []
        cursor = self.conn.cursor()
        cursor.execute('SELECT ADDRESS1, ADDRESS2, CITY, STATE, "ZIP CODE" FROM 2018_Agency_Mail')

        for row in cursor.fetchall():
            data.append([self.clean(field) for field in row])

        return data

    @staticmethod
    def clean(string):

        if string:
            string = string.strip()

        return string


class ProcessData:

    def __init__(self, data):

        self.pobox_pattern = re.compile(r'P[\.]?(OST)?\s?O[\.]?(FFICE)?\s((BOX)|(DRAWER))', re.IGNORECASE)
        self.data = []
        for item in data:
            item = self.remove_items(item)
            self.data.append(' '.join(item).strip())

    def remove_items(self, data):

        for i, address_field in enumerate(data):
            if address_field:
                if self.pobox_pattern.search(address_field):
                    data[i] = ''
            else:
                data[i] = ''
        return data


if __name__ == '__main__':

    addr = '2039 N Meridian Rd APT 139 Tallahassee FL 32303'
    addr = '296 Champions Way, Tallahassee, Florida 32306-2641'
    addr = 'test.txt'
    addr = 'Dept. of Behavioral Sciences and Social Medicine, 1115 W. Call Street, Tallahassee, FL 32306-4300'
    addr = '2001 Old St. Augustine Rd Ste L208, Tallahassee, FL 32301'
    addr = '2365 Centerville Road, R-3, Tallahassee, FL 32308'
    addr = '8 South Main Street, P. O. Box 647, Chattahoochee, FL 32324'

    # h = HERE()
    # h.find(addr, web=True)

    # a = Access()
    # addresses = a.get_data()

    x = [['2001 Old St. Augustine Rd', 'Ste L208', 'Tampa', 'FL', '33607'],
         ['8 South Main Street', 'P. O. Box 647', 'Baker', 'FL', '32531'],
         ['P O BOX 29056', '18260 SW 66 ST', 'DAVIE', 'FL', '33329'],
         [None, 'POST OFFICE OX 636', 'ALACHUA', 'FL', '32615'],
         [None, 'STAR RT 2 BOX 514', 'SATSUMA', 'FL', '32089'],
         ['P.O. BOX 1320', None, 'LAKE WALES', 'FL', '33853'],
         ['515 North Flagler Drive', None, 'West Palm Beach', 'FL', '33401'],
         ['', 'POST OFFICE DRAWER C', 'LIVE OAK', 'FL', '32060'],
         [None, None, 'Dania Beach', 'FL', None]]

    proc = ProcessData(x)
    print(proc.data)