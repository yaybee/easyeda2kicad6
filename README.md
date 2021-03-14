# EasyEDA 2 KiCad for Kicad V6

This is the modified EasyEDA converter for support of the (upcoming) Kicad6 version.
Repo: https://github.com/yaybee/easyeda2kicad6  
This converter will only work with the nightly builds of Kicad V6 until V6 is released.

You can find the original Kicad5 repo here : https://github.com/wokwi/easyeda2kicad

## Installation

This is a commandline version. It is written in Typescript.
You can run it under Node.js or a developement platform like VSC.  
At this moment manual installation is required; no npm package is available.
The javascript files are in the dist directory.

### Node.js

- Download the easyed2kicad6 zip file and extract files.
- Download Node.js and install it.
- Open Node.js command prompt and change dir to the easyed2kicad6 root directory
- Install uuid support: npm install uuid
- Check installation: node dist/main.js; usage output should occur. If OK you can start converting!

```
node dist/main.js "eda".json
```

## Usage

```
Usage: node dist/main.js "ARG"
        Schematics ARG : <input.json> [-] (stout OR input_dir/input_name/input_name.kicad_sch) [sheet_number]
        Board ARG      : <input.json> [-] (stout OR input_dir/input_name/input_name.kicad_pcb
        Lib_symbol ARG : <input.json> [-] (stout OR input_dir/input_name/input_name.kicad_pcb
        Footprint ARG  : <input.json> [-] (stout OR input_dir/EasyEDA.pretty/"footprint".kicad_mod)
```

## How to convert your EasyEDA schematics and PCB

### The basic conversion steps

1. First convert the PCB: rename the PCB .json file to the name you want for your project and run the conversion tool.
2. Now you have a directory with a Kicad project file and PCB file (named as your json input filename).
3. Open the Kicad project and go to the PCB file. You will see your converted PCB and the conversion remarks.
4. Add the created EasyEDA.pretty directory to your Footprint libraries, menu: Preferences > Manage Footprint Libraries - tab Project Specific Libraries.
5. Go to menu: File > Export > Export Footprints to Library...; choose EasyEDA as library and click OK.
6. You can now convert the schematics: replace the PCB json with the schematics json (same name) and run the conversion tool.
7. Check if the converted schematics is in the same directory as the converted PCB.
8. Switch to Kicad and open the schematics file. You will see your converted schematics and the conversion remarks.
9. Add the created "input filename".sym file to your Symbol libraries, menu: Preferences > Manage Symbol Libraries - tab Project Specific Libraries.
10. Check conversion remarks for multi-part symbols and combine these first by replacing the original symbols with one new combined symbol (one footprint).
11. Open the annotation window; enable option "Keep existing annotations" and click Annotate.
12. Check annotation result: only symbols without a trailing number and PWR symbols should have been newly annotated.
13. IMPORTANT: make a note of all changed symbol references for PCB footprint reference update.
14. Next run Footprint assignment: click Yes on the legacy footprint question.
15. Look at the footprint assignment; all symbols should have a footprint from the EasyEDA directory (EasyEDA:).
16. If not: select the EasyEDA library in the left panel and set Footprint filter to only Library.
17. Correct symbols with incorrect footprints by selecting the correct one from the right panel and finally click OK.
18. Switch to PCB and correct references (from step 12) of the footprints to the new annotation (e.g. ICSP to ICSP1).
19. Now select menu: Tools > Update PCB from Schematics and only select option "Relink footprints to schematic symbols based on their reference designators".
20. Click Update PCB > no new footprints should be created. If you see new footprints: close PCB without saving and try to correct the issues.
21. Check menu: Tools > Update schematics from PCB > no outstanding issues should be detected.
22. Save the updated schematics and PCB.

### Nest steps

Schematics and PCB should now be in sync and inspection of schematics and PCB can start:

- Read the conversion remarks of schematics and PCB: make a note of required actions; when ready you can delete the remarks.
- Run ERC and DRC and try to correct the errors; the conversion tool gives no guarantees for a correct manufactured PCB.
- Silkscreen placing or size may deviate from the original; make corrections as required.
- PCB art has been converted to polylines and may be schadowed (overlays); change fill or line width to get the best result.
- TIP: switch off layers to better evaluate a specific layer like top and bottom copper layers.
- Don't forget to press "B" for the copper pours.

Tip for 3D viewer:

- Switch of solder paste layer to see pad holes in the board; menu: Preferences > Display Options

## Notes

The output is in the Kicad version 6 format. Little information was available during development,
so the converter has been build by reverse engineering Kicad schematics.
This has partly been documented as comment in the source files (for future reference).

Try it out, there are a few examples in the examples directory.

## Known issues

1. Kicad board text (fp_text) rotate does not work properly. The rotation for 0 & 180 as well as 90 & 270 degree are the same.
   EasyEDA text will not always be positioned properly in Kicad; moving the text manually is needed for now. However for gl_text it works as expected.
2. Some board text labels in EasyEDA will be positioned incorrectly in Kicad due to a bug(?) in EasyEDA. This can be corrected be rotating the text manually.
3. Combining symbols to create mulitpart item is possible, but due to Kicad bugs some shapes need to be redrawn after copy/paste of the original items.

## Known limitations

### Schematics

1. Multi-part library items (eg opAmps) are not supported; manual update in Kicad is possible.
2. Basic shared library items only; simular components with the same rotation angle have a shared symbol in the schematics.
3. Arcs in symbols may be malformed due to conversion limitations of Kicad; manual update this (no requirement) or replace with a native Kicad symbol.
4. Picture support is limited to base64 embedded png; manual resize and positioning may be required.

### Board (PCB)

1. Multiple local labels on one net are converted, but not supported by Kicad; requires manual inspection (DRC).
2. Footprint via is not supported and converted to via on pcb.
3. Eda copper items converted to Kicad zones may be shadowed (invisible); requires manual inspection of zone priority.
4. Svg nodes (mostly silkscreen art) are converted to filled polylines and will not support cutouts (non filled area within shape).

## License

Most of the code is released under the MIT license, with the exception of [src/svg-arc.ts](src/svg-arc.ts), which is
released under the Apache 2.0 license.
