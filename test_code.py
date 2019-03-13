import HERE


def test_replace_Good():

    addr = [['2001 Old St. Augustine Rd', 'Ste L208', 'Tampa', 'FL', '33607']]
    proc = HERE.ProcessData(addr)
    assert proc.data == ['2001 Old St. Augustine Rd Ste L208 Tampa FL 33607']

def test_replace_1PO():

    addr = [['8 South Main Street', 'P. O. Box 647', 'Baker', 'FL', '32531']]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['8 South Main Street Baker FL 32531']

def test_replace_0PO():

    addr = [['P O BOX 29056', '18260 SW 66 ST', 'DAVIE', 'FL', '33329']]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['18260 SW 66 ST DAVIE FL 33329']

def test_replace_0None_1PO():

    addr = [[None, 'POST OFFICE BOX 636', 'ALACHUA', 'FL', '32615']]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['ALACHUA FL 32615']

def test_replace_0None():

    addr = [[None, 'STAR RT 2 BOX 514', 'SATSUMA', 'FL', '32089']]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['STAR RT 2 BOX 514 SATSUMA FL 32089']

def test_replace_0PO_1None():

    addr = [['P.O. BOX 1320', None, 'LAKE WALES', 'FL', '33853']]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['LAKE WALES FL 33853']

def test_replace_1None():

    addr = [['515 North Flagler Drive', None, 'West Palm Beach', 'FL', '33401']]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['515 North Flagler Drive West Palm Beach FL 33401']

def test_replace_0None_1PD():

    addr = [[None, 'POST OFFICE DRAWER C', 'LIVE OAK', 'FL', '32060']]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['LIVE OAK FL 32060']

def test_replace_014None():

    addr = [[None, None, 'Dania Beach', 'FL', None]]
    new_addr = HERE.ProcessData(addr).data
    assert new_addr == ['Dania Beach FL']