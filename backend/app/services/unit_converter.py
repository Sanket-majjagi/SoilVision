def convert_meter_to_shc(readings: dict) -> dict:
    """
    Convert LCD meter readings to SHC standard values.
    NPK values are multiplied by 2.24 to convert from mg/kg to kg/ha.
    All other values like pH and EC remain untouched.
    """
    converted = {}
    for key, val in readings.items():
        if key in ["nitrogen", "phosphorus", "potassium"]:
            if val is not None:
                converted[key] = round(val * 2.24, 2)
            else:
                converted[key] = None
        else:
            converted[key] = val
            
    return converted
