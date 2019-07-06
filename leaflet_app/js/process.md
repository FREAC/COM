### HOW TO FILTER

- For each select change
    - Assign current selections to filter object

    - get current selections for all of the select dropdowns 
        - loop through filter object by key
            if selection[key] has selections withing it, append to filter object
            else continue

    - Create filterHolder array to hold all active filters

    - Create [OR] filter from json_group (filterOptions())

    - append the [OR] filter to the filterHolder array

    - Find repeats in filterHolder array
        - TODO: How to find repeats?

    - append final filter to a FeatureGroup

    - execute displayFilterData() function