# EasyEDA 2 KiCad


This is the modified EasyEDA converter for support of the (upcoming) Kicad6 version.
You can find the original Kicad5 repository by Uri Shaked here : https://github.com/wokwi/easyeda2kicad

This converter will only work with the nightly builds of Kicad V6 until it will be released in 2021.


## Installation

```
npm install -g easyeda2kicad6
```

## Usage

```
Usage: easyeda2kicad "ARG"
        Schematics ARG : <input.json> [-] (stout else auto-generated: "input name".kicad_sch) [schematic_sheet_number]
        Board ARG     : <input.json> [-] (stout else auto-generated: "input name".kicad_pcb)
        Lib_symbol ARG : <input.json> [-] (stout else auto-generated: EasyEDA.kicad_sym)
        Footprint ARG : <input.json> [-] (stout else auto-generated: "footprint".kicad_mod in directory ./EasyEDA.pretty)
```

## Notes

The output is in the Kicad version 6 format. I had little information available, so the converter
has been build by reverse engineering Kicad schematics. This has partly been documented
as comment in the source files (for future reference).

Try it out, there are a few examples in the examples directory.
The converter will output the Kicad config in a formatted way, so debugging is easier.

## Known issues

1. Kicad board text (fp_text) rotate does not work properly. The rotation for 0 & 180 as well as 90 & 270 degree are the same.
   EasyEDA text will not always be positioned properly in Kicad; moving the text manually is needed for now. However for gl_text it works as expected.
2. Some text labels in EasyEDA will be positioned incorrectly in Kicad due to a bug(?) in EasyEDA. This can be corrected be rotating the text manually.

## Known limitations

1. Multi-part library items (eg opAmps) are not supported,
2. Basic shared library items, so only simular components with the same rotation angle have a shared symbol in the schematics,
3. No image support on the schematic sheet,


## License

>>>>>>> schematic6
Most of the code is released under the MIT license, with the exception of [src/svg-arc.ts](src/svg-arc.ts), which is
released under the Apache 2.0 license.
