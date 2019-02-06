import os
import urllib.parse as parse
import webbrowser
import re
import json
import base64

import pyodbc
import requests
import shapefile


class HERE:

    def __init__(self, fname='HERE.csv'):

        self.app_id = '3peEKduvqXuYDzZZnj0g'
        self.app_code = 'uur4uqOEz0zJZZWRr1kg1w'
        self.additional_data = 'IncludeMicroPointAddresses,true;PreserveUnitDesignators,true'
        self.fname = fname

    def find(self, data, web=False):

        json_response = self.geocode_string(data)
        google_url = 'https://www.google.com/maps/search/?api=1&query={}'

        try:
            results = json_response['Response']['View'][0]['Result']
            for result in results:
                rows = self.format_result(result)
                self.write_to_csv(data, rows)
        except IndexError:
            self.write_to_csv(data)



        # results = results['Response']['View'][0]['Result']
        # for result in results:
        #     print(result)
        #     print()
        #     print('Main result:', result['Location']['Address']['Label'])
        #     if web:
        #         latlon = '{Latitude},{Longitude}'.format(**result['Location']['DisplayPosition'])
        #         webbrowser.open(google_url.format(latlon), new=2)
        #     print('Relevance:', result['Relevance'])
        #     print('Match Quality: {}'.format(result['MatchQuality']))
        #     if 'Related' in result['Location']:
        #         for related in result['Location']['Related']:
        #             print('-' * 20)
        #             print('Related result:', related['Location']['Address']['Label'])
        #             if web:
        #                 latlon = '{Latitude},{Longitude}'.format(**related['Location']['DisplayPosition'])
        #                 webbrowser.open(google_url.format(latlon), new=2)

    def geocode_string(self, address):

        here = 'https://geocoder.api.here.com/6.2/geocode.json'
        payload = {'app_id': self.app_id, 'app_code': self.app_code, 'additionaldata': self.additional_data,
                   'searchtext': parse.quote_plus(address), 'country': 'USA', 'state': 'US:FL'}

        r = requests.get(here, params=payload)
        r.raise_for_status()

        return r.json()

    @staticmethod
    def format_result(result):

        rows = []
        row = []

        for key in ('Relevance', 'MatchLevel'):
            try:
                row.append(result[key])
            except KeyError:
                row.append(None)

        # Gather match quality information
        rmq = result['MatchQuality']
        for key in ('PostalCode', 'City', 'Street', 'HouseNumber', 'Unit'):
            try:
                row.append(rmq[key])
            except KeyError:
                row.append(None)

        # Gather address information
        addr = result['Location']['Address']
        for key in ('County', 'PostalCode', 'City', 'Street', 'HouseNumber'):
            try:
                row.append(addr[key])
            except KeyError:
                row.append(None)

        # Gather unit information and lon/lat from micro addresses,
        # otherwise gather lon/lat from addresses
        locs = []
        try:
            micro = result['Location']['Related']
            for loc in micro:
                d_pos = loc['Location']['DisplayPosition']
                lon = d_pos['Longitude']
                lat = d_pos['Latitude']
                unit_num = loc['Location']['Address']['Unit']
                locs.append([unit_num, lon, lat])
        except KeyError:
            pos = result['Location']['DisplayPosition']
            lon = pos['Longitude']
            lat = pos['Latitude']
            unit_num = None
            locs.append([unit_num, lon, lat])

        for loc in locs:
            loc_row = row + loc
            rows.append(loc_row)

        return rows

    def write_to_csv(self, data, rows=[[None]*15]):

        if not os.path.isfile(self.fname):
            header = ['Input', 'Relevance', 'MatchLevel', 'MQ_PostalCode', 'MQ_City', 'MQ_Street', 'MQ_HouseNumber',
                      'MQ_Unit', 'County', 'PostalCode', 'City', 'Street', 'HouseNumber', 'Unit', 'Longitude',
                      'Latitude']
            with open(self.fname, 'w') as csvfile:
                line = '{}\n'.format(','.join(str(column) for column in header))
                csvfile.write(line)

        with open(self.fname, 'a') as csvfile:
            for row in rows:
                row = [data] + row
                line = '{}\n'.format(','.join(str(column) for column in row))
                csvfile.write(line)
        return


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
            item = self.remove_po_box(item)
            item = list(self.remove_none(item))
            self.data.append(' '.join(item).strip().replace(',', '').replace('  ', ' '))
        self.data = list(dict.fromkeys(self.data))

    @staticmethod
    def remove_none(data):

        return filter(None, data)

    def remove_po_box(self, data):

        for i, address_field in enumerate(data):
            if address_field:
                if self.pobox_pattern.search(address_field):
                    data[i] = None
        return data


def d2s(d):

    try:
        return d.strftime('%Y-%m-%d')
    except AttributeError:
        encoded = base64.encodebytes(bytes(d))
        return encoded.decode('ascii')
    except:
        raise TypeError('Problem with: {}'.format(d))


with shapefile.Reader(r'Group Care/Group_Care') as shp:

    records = shp.iterRecords()

    fields = ['CompanyNam', 'CompleteSt', 'CITY', 'ZIP_CODE', 'STATE', 'Latitude', 'Longitude']
    fields = ['CompanyNam', 'Latitude', 'Longitude']

    json_data = [dict((field, rec.as_dict()[field]) for field in fields if field in rec.as_dict()) for rec in records]

with open('group_care_culled2.json', 'w') as outfile:
    json.dump(json_data, outfile, default=d2s)


if __name__ == '__main__':

    addr = '2039 N Meridian Rd APT 139 Tallahassee FL 32303'
    addr = '296 Champions Way, Tallahassee, Florida 32306-2641'
    addr = 'test.txt'
    addr = 'Dept. of Behavioral Sciences and Social Medicine, 1115 W. Call Street, Tallahassee, FL 32306-4300'
    addr = '2001 Old St. Augustine Rd Ste L208, Tallahassee, FL 32301'
    addr = '2365 Centerville Road, R-3, Tallahassee, FL 32308'
    addr = '8 South Main Street, P. O. Box 647, Chattahoochee, FL 32324'
    addr = '110 NORTH APOPKA AVE INVERNESS FL 32650'
    addr = 'Route 2 Box 100A Greenville FL 32331'

    h = HERE('group_care.csv')
    # h.find(addr, web=False)

    # for num in range(1, 4):
    #     with open('pretty_response{}.json'.format(num)) as json_data:
    #         d = json.load(json_data)
    #         h.find(d)

    # access = Access()
    # data = access.get_data()
    # addresses = ProcessData(data)
    #
    # for address in addresses.data[:30]:
    #     print(address)
    #     h.find(address)

    # with open('group_care_culled.json') as f:
    #     data = json.load(f)
    #     data = [[s['CompleteSt'], s['CITY'], s['STATE'], s['ZIP_CODE']] for s in data]
    #
    # addresses = ProcessData(data)
    # for address in addresses.data[:30]:
    #     print(address)
    #     h.find(address)
