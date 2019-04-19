import base64
import csv
import json
import os
import re
import urllib.parse as parse

import requests


class Cleaner:

    def clean_data(self, data):

        clean_data = []
        for item in data:
            item = self._remove_po_box(item)
            item = list(self._remove_none(item))
            clean_data.append(' '.join(item).strip().replace(',', '').replace('  ', ' '))
        return clean_data

    @staticmethod
    def _remove_po_box(data):

        po_box_pattern = re.compile(r'(P[\.]?(OST)?\s?O[\.]?(FFICE)?\s((BOX)|(DRAWER))\s\d*)(.*)', re.IGNORECASE)
        for i, address_field in enumerate(data):
            if address_field:
                m = po_box_pattern.search(address_field)
                if m:
                    if m.group(7):
                        data[i] = m.group(7).lstrip()
                    else:
                        data[i] = None
        return data

    @staticmethod
    def _remove_none(data):

        return filter(None, data)

    @staticmethod
    def remove_spaces(string):

        if string:
            string = string.strip()

        return string


class AddressData(Cleaner):

    def __init__(self, input_text, fields=None):

        self.warning_num = 1
        self.input_text = input_text
        self.fields = fields

        try:
            new_data = self.get_data()
            data = self.clean_data(new_data)
        except FileNotFoundError:
            data = [input_text]

        count = len(data)

        if count > self.warning_num:
            s = input(f'{count} records will be geocoded. Continue? Enter [Y]es or [N]o: ').lower()
            if s != 'y':
                data = []
        self.data = data

    def get_data(self):

        with open(self.input_text) as csvfile:
            reader = csv.DictReader(csvfile)

            if not self.fields:
                self.fields = reader.fieldnames

            return [list((self.remove_spaces(row[field]) for field in self.fields if field in row))
                    for row in reader]


class Geocoder(AddressData):

    def __init__(self, infile, outfile='HERE.csv', fields=None, fl=False, combine=False):

        super().__init__(infile, fields)
        self.outfile = outfile
        self.FL = fl
        self.combine = combine
        self.app_id = '3peEKduvqXuYDzZZnj0g'
        self.app_code = 'uur4uqOEz0zJZZWRr1kg1w'
        self.additional_data = 'IncludeMicroPointAddresses,true;PreserveUnitDesignators,true'

        for address in self.data:
            print(f'Geocoding {address}')
            self.find(address)

    def find(self, data):

        json_response = self.geocode_string(data)

        try:
            results = json_response['Response']['View'][0]['Result']
            for result in results:
                rows = self.format_result(result)
                self.write_to_csv(data, rows)
        except IndexError:
            self.write_to_csv(data)

    def geocode_string(self, address):

        here = 'https://geocoder.api.here.com/6.2/geocode.json'
        payload = {'app_id': self.app_id, 'app_code': self.app_code, 'additionaldata': self.additional_data,
                   'searchtext': parse.quote_plus(address)}
        if self.FL:
            payload.update({'country': 'USA', 'state': 'US:FL'})

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

    def write_to_csv(self, data, rows=[[None] * 15]):

        if not os.path.isfile(self.outfile):
            header = ['Input', 'Relevance', 'MatchLevel', 'MQ_PostalCode', 'MQ_City', 'MQ_Street', 'MQ_HouseNumber',
                      'MQ_Unit', 'County', 'PostalCode', 'City', 'Street', 'HouseNumber', 'Unit', 'Longitude',
                      'Latitude']
            with open(self.outfile, 'w') as csvfile:
                line = '{}\n'.format(','.join(str(column) for column in header))
                csvfile.write(line)

        with open(self.outfile, 'a') as csvfile:
            for row in rows:
                row = [data] + row
                line = '{}\n'.format(','.join(str(column) for column in row))
                csvfile.write(line)
        return


class Access:

    def __init__(self):

        import pyodbc
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


def date2string(d):
    try:
        return d.strftime('%Y-%m-%d')
    except AttributeError:
        encoded = base64.encodebytes(bytes(d))
        return encoded.decode('ascii')
    except:
        raise TypeError('Problem with: {}'.format(d))


def shp2json(fname, json_fname=None, fields=None):
    import shapefile
    with shapefile.Reader(fname) as shp:

        records = shp.iterRecords()
        if not fields:
            fields = [field[0] for field in shp.fields[1:]]

        data = [dict((field, rec.as_dict()[field]) for field in fields if field in rec.as_dict()) for rec in records]

    if json_fname:
        with open(json_fname, 'w') as outfile:
            json.dump(data, outfile, default=date2string)

    return json.dumps(data, default=date2string)


def csv2json(fname, json_fname=None, fields=None):
    with open(fname) as csvfile:
        reader = csv.DictReader(csvfile)

        if not fields:
            fields = reader.fieldnames

        data = [dict((field, row[field]) for field in fields if field in row) for row in reader]

    if json_fname:
        with open(json_fname, 'w') as outfile:
            json.dump(data, outfile, default=date2string)

    return json.dumps(data, default=date2string)


def clean_csv(infile, outfile):

    with open(infile) as csv_in, open(outfile, 'w') as csv_out:
        reader = csv.DictReader(csv_in)
        writer = csv.DictWriter(csv_out, reader.fieldnames, lineterminator='\n')
        writer.writeheader()

        for row in reader:
            for k in row:
                row[k] = row[k].strip()
                if k == 'phone':
                    num = re.sub(r'\D', '', row[k])

                    if num:
                        new_num = '{}-{}-{}'.format(num[:3], num[3:6], num[6:10])
                        if len(num) > 10:
                            new_num += ' x{}'.format(num[10:])
                        row[k] = new_num
                if k == 'service':
                    service = re.sub(r'[^\w\,]', "", row[k])
                    row[k] = service

            writer.writerow(row)
