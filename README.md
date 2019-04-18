## HERE Geocoder Guide

### How to install the HERE Geocoder:

1. Either clone this repository using __git__ or download a zipped version of the files.
2. Move the `HERE.py` Python file to the folder containing your address data and Python scripts.
    1. Alternatively, move the file to a directory specified in your computer's Python path.

### How to use the HERE Geocoder:

1. In a separate Python file, import `HERE.py` as a module.
2. Create a `Geocoder()` object and specify the input CSV file.
3. CSV files containing more than one address must be approved by the user before they are geocoded.
    1. To approve the geocoding process, press `Y` at the prompt, followed by the `Enter` key.
    2. To stop the geocoding process, press any other key at the prompt, followed by the `Enter` key.

`Geocoder(infile, outfile='HERE.csv', fields=None, fl=False)`

- `infile`: a CSV file containing the address data to be geocoded
  - The input file must be in CSV format and must contain headers
  - Optionally, a single address in string format can be provided instead of a file name

- `outfile`: the name of the output CSV file containing the geocoded data
  - If a full path is not provided, the output file will be created in the same location as the `HERE.py` file
  - The default file name is __HERE.csv__

- `fields`: the fields of the input CSV file containing the address data to geocode
  - By default, all fields of the input CSV file are included for geocoding
  - Fields should be strings in list format: `['ADDRESS', 'CITY', 'ZIP']`

- `fl`: whether to limit the geocoder's results to Florida locations
  - The default setting does __not__ limit the geocoder's results

```python
# Import the HERE module
>>> import HERE
# Create a Geocoder object using a CSV file as input
>>> HERE.Geocoder('my_addresses.csv', outfile='my_geocoded_addresses.csv')
# Create a Geocoder object and specify the fields to use
>>> HERE.Geocoder('my_addresses.csv', fields=['STREET', 'CITY'])
# Create a Geocoder object using a single address as input and limit results to Florida
>>> HERE.Geocoder('296 Champions Way Tallahassee FL 32304', fl=True)
```

### How to interpret the output:

A single input address can have multiple rows of potential matches.

Relevance and match quality is reported on a scale of 0.0 (low) to 1.0 (high). 

Column Name | Explanation
--- | ---
Input | The target address from the input file
Relevance | How likely the geocoder rates the results as being the intended target
MatchLevel | The detail with which the input address could be successfully matched
MQ_PostalCode | The quality of the match at the postal code level
MQ_City | The quality of the match at the city level
MQ_Street | The quality of the match at the street level
MQ_HouseNumber | The quality of the match at the house number level
MQ_Unit | The quality of the match at the unit (suite, apartment, *etc*.) level
County | The county of the geocoded address
PostalCode | The post code of the geocoded address
City | The city of the geocoded address
Street | The street of the geocoded address
HouseNumber | The house number of the geocoded address
Unit | The unit (suite, apartment, *etc*.) of the geocoded address
Longitude | The longitude of the geocoded address in decimal degrees format
Latitude | The latitude of the geocoded address in decimal degrees format