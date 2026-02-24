
const csvData = `name,Latitude,Longitude
1 Classic Cabin,25.841827,66.542223
10 Classic Cabin,25.841528,66.541656
101 Superior Cabin,25.839704,66.542181
102 Superior Cabin,25.839652,66.542111
103 Superior Cabin,25.839577,66.541999
104 Superior Cabin,25.839523,66.541928
105 Superior Cabin,25.839437,66.541827
106 Superior Cabin,25.839389,66.541758
107 Superior Cabin,25.83931,66.541649
108 Superior Cabin,25.83926,66.541575
109 Superior Cabin,25.838976,66.541601
11 Classic Cabin,25.84119,66.541491
110 Superior Cabin,25.838782,66.541626
111 Superior Cabin,25.838481,66.541653
112 Superior Cabin,25.838304,66.541672
113 Superior Cabin,25.838336,66.541906
114 Superior Cabin,25.838385,66.54198
115 Superior Cabin,25.838618,66.541837
116 Superior Cabin,25.838741,66.541781
117 Superior Cabin,25.838886,66.541925
118 Superior Cabin,25.839007,66.54187
119 Superior Cabin,25.839155,66.542021
12 Classic Cabin,25.841359,66.541466
120 Superior Cabin,25.83927,66.54196
121 Superior Cabin,25.838631,66.542071
122 Superior Cabin,25.83882,66.542098
123 Superior Cabins,25.839083,66.542125
124 Superior Cabin,25.839292,66.542142
125 Superior Cabin,25.837465,66.541958
126 Superior Cabin,25.837288,66.541943
127 Superior Cabin,25.837006,66.541911
128 Superior Cabin,25.836824,66.541894
129 Superior Cabin,25.836526,66.541877
13 Classic Cabin,25.841083,66.541319
130 Superior Cabin,25.836341,66.541862
131 Superior Cabin,25.837325,66.541812
132 Superior Cabin,25.837137,66.541798
133 Superior Cabin,25.836856,66.541766
134 Superior Cabin,25.836676,66.541751
135 Superior Cabin,25.836408,66.541729
136 Superior Cabin,25.836233,66.541713
137 Superior Cabin,25.837513,66.54166
138 Superior Cabin,25.837454,66.541589
139Superior Cabin,25.837135,66.541661
14 Classic Cabin,25.841255,66.541304
140 Superior Cabin,25.83717,66.541591
141 Superior Cabin,25.836786,66.541638
142 Superior Cabin,25.836813,66.541569
143 Superior Cabin,25.83648,66.541609
144 Superior Cabin,25.83651,66.541541
145 Superior Cabin,25.836164,66.541589
146 Superior Cabin,25.836188,66.541514
15 Classic Cabin,25.842278,66.542194
16 Classic Cabin,25.842458,66.54219
17 Classic Cabin,25.842099,66.541911
18 Classic Cabin,25.842244,66.541874
19 Classic Cabin,25.841888,66.541709
2 Classic Cabin,25.841977,66.542184
20 Classic Cabin,25.842061,66.54167
21 Classic Cabin,25.841796,66.5416
22 Classic Cabin,25.841963,66.541596
23 Classic Cabin,25.841696,66.541408
24 Classic Cabin,25.841874,66.541403
25 Classic Cabin,25.842828,66.542283
26 Classic Cabin,25.842771,66.542211
27 Classic Cabin,25.842675,66.542111
28 Classic Cabin,25.842617,66.542046
29 Classic Cabin,25.842606,66.541776
3 Classic Cabin,25.841716,66.542097
30 Classic Cabin,25.842531,66.541713
301 B0 Igloo,25.826953,66.541138
302-303 B1 Igloo,25.826781,66.541325
304-305 A1 Igloo,25.826645,66.541494
306-307 A2 Igloo,25.827047,66.54158
308-309 A3 Igloo,25.827439,66.541645
31 Classic Cabin,25.842464,66.541594
310-311 A4 Igloo,25.827897,66.541717
312-313 A5 Igloo,25.828337,66.541796
314-315 A6 Igloo,25.828734,66.541859
316-317 A7 Igloo,25.829104,66.541918
32 Classic Cabin,25.8424,66.54153
33 Classic Cabin,25.842309,66.54142
34 Classic Cabin,25.842244,66.541354
35 Classic Cabin,25.842655,66.541563
36 Classic Cabin,25.84259,66.541497
37 Classic Cabin,25.842486,66.541377
38 Classic Cabin,25.842425,66.541312
39 Classic Cabin,25.841544,66.541271
4 Classic Cabin,25.841869,66.542058
40 Classic Cabin,25.841721,66.541243
41 Classic Cabin,25.842838,66.541748
42 Classic Cabin,25.842767,66.541684
43 Classic Cabin,25.843247,66.541746
44 Classic Cabin,25.843417,66.541739
45 Classic Cabin,25.843138,66.541616
46 Classic Cabin,25.843307,66.541607
47 Classic Cabin,25.843052,66.541475
48 Classic Cabin,25.843197,66.541453
49 Classic Cabin,25.842905,66.541332
5 Classic Cabin,25.841542,66.541948
50 Classic Cabin,25.843071,66.5413
51 Classic Cabin,25.84277,66.541195
52 Classic Cabin,25.842934,66.541168
53 Classic Cabin,25.843221,66.541131
54 Classic Cabin,25.843398,66.54113
55 Classic Cabin,25.843355,66.541273
56 Classic Cabin,25.84354,66.541266
57 Classic Cabin,25.843508,66.541424
58 Classic Cabin,25.84368,66.541395
59 Classic Cabin,25.84365,66.541567
6 Classic Cabin,25.841721,66.541944
60 Classic Cabin,25.843803,66.541539
61 Classic Cabin,25.843739,66.541702
62 Classic Cabin,25.843916,66.541699
63 Classic Cabin,25.843771,66.541885
64 Classic Cabin,25.843932,66.541876
65 Classic Cabin,25.843742,66.542018
66 Classic Cabin,25.843919,66.542012
67 Classic Cabin,25.843717,66.542191
68 Classic Cabin,25.843892,66.542182
69 Classic Cabin,25.843184,66.542207
7 Classic Cabin,25.841453,66.541815
70 Classic Cabin,25.843353,66.542233
71 Classic Cabin,25.843254,66.542031
72 Classic Cabin,25.843431,66.542046
73 Classic Cabin,25.843239,66.54194
74 Classic Cabin,25.843418,66.541944
8 Classic Cabin,25.841625,66.54181
9 Classic Cabin,25.84137,66.541688
A 201-212 Suites,25.848904,66.541345
B 213-224 Suites,25.848995,66.540999
C 225-239 Suites,25.84892,66.540502`;

export const accommodationKML = `
<Folder id="Accommodation">
${csvData.split('\n').slice(1).map(line => {
    const parts = line.trim().split(',');
    if (parts.length < 3) return '';
    const lat = parts[parts.length - 2];
    const lng = parts[parts.length - 1];
    const name = parts.slice(0, parts.length - 2).join(',');
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `  <Placemark id="${id}">
    <name>${name}</name>
    <styleUrl>#icon-1602-9C27B0</styleUrl>
    <Point><coordinates>${lat},${lng},0</coordinates></Point>
  </Placemark>`;
}).join('\n')}
</Folder>
`;
