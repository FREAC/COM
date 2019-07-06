### HOW TO FILTER
- For each select change
    - Create filterHolder array to hold all active filters

    - Create [OR] filter from json_group (filterOptions())

    - append the [OR] filter to the filterHolder array

    - Find repeats in filterHolder array
        - TODO: How to find repeats?

    - append final filter to a FeatureGroup

    - execute displayFilterData() function