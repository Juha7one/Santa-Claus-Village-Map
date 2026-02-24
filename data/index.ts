
import { accommodationKML } from './accommodation.kml';
import { attractionsKML } from './attractions.kml';
import { facilitiesKML } from './facilities.kml';
import { foodAndDrinkKML } from './food-and-drink.kml';
import { pathsKML } from './paths.kml';
import { shoppingKML } from './shopping.kml';
import { transportationKML } from './transportation.kml';

export const kmlDataString = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Santa Claus Village</name>
    <description>Arctic Circle Rovaniemi</description>
    <Style id="icon-1502-C2185B-normal">
      <IconStyle>
        <color>ff5b18c2</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1502-C2185B-highlight">
      <IconStyle>
        <color>ff5b18c2</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1502-C2185B">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1502-C2185B-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1502-C2185B-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1507-0F9D58-normal">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1507-0F9D58-highlight">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1507-0F9D58">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1507-0F9D58-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1507-0F9D58-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1517-F57C00-normal">
      <IconStyle>
        <color>ff007cf5</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1517-F57C00-highlight">
      <IconStyle>
        <color>ff007cf5</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1517-F57C00">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1517-F57C00-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1517-F57C00-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1532-1A237E-normal">
      <IconStyle>
        <color>ff7e231a</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1532-1A237E-highlight">
      <IconStyle>
        <color>ff7e231a</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1532-1A237E">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1532-1A237E-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1532-1A237E-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1577-F57C00-normal">
      <IconStyle>
        <color>ff007cf5</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1577-F57C00-highlight">
      <IconStyle>
        <color>ff007cf5</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1577-F57C00">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1577-F57C00-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1577-F57C00-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1601-0F9D58-normal">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1601-0F9D58-highlight">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1601-0F9D58">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1601-0F9D58-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1601-0F9D58-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1602-9C27B0-normal">
      <IconStyle>
        <color>ffb0279c</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1602-9C27B0-highlight">
      <IconStyle>
        <color>ffb0279c</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1602-9C27B0">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1602-9C27B0-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1602-9C27B0-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1603-C2185B-normal">
      <IconStyle>
        <color>ff5b18c2</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1603-C2185B-highlight">
      <IconStyle>
        <color>ff5b18c2</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1603-C2185B">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1603-C2185B-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1603-C2185B-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1684-0288D1-normal">
      <IconStyle>
        <color>ffd18802</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1684-0288D1-highlight">
      <IconStyle>
        <color>ffd18802</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1684-0288D1">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1684-0288D1-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1684-0288D1-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1694-0F9D58-normal">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1694-0F9D58-highlight">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1694-0F9D58">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1694-0F9D58-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1694-0F9D58-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1733-757575-normal">
      <IconStyle>
        <color>ff757575</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1733-757575-highlight">
      <IconStyle>
        <color>ff757575</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1733-757575">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1733-757575-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1733-757575-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1774-0F9D58-normal">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1774-0F9D58-highlight">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1774-0F9D58">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1774-0F9D58-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1774-0F9D58-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1859-9C27B0-normal">
      <IconStyle>
        <color>ffb0279c</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1859-9C27B0-highlight">
      <IconStyle>
        <color>ffb0279c</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1859-9C27B0">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1859-9C27B0-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1859-9C27B0-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1872-0F9D58-normal">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1872-0F9D58-highlight">
      <IconStyle>
        <color>ff589d0f</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1872-0F9D58">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1872-0F9D58-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1872-0F9D58-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1899-1A237E-nodesc-normal">
      <IconStyle>
        <color>ff7e231a</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
        <hotSpot x="32" xunits="pixels" y="64" yunits="insetPixels"/>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
      <BalloonStyle>
        <text><![CDATA[<h3>$[name]</h3>]]></text>
      </BalloonStyle>
    </Style>
    <Style id="icon-1899-1A237E-nodesc-highlight">
      <IconStyle>
        <color>ff7e231a</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
        <hotSpot x="32" xunits="pixels" y="64" yunits="insetPixels"/>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
      <BalloonStyle>
        <text><![CDATA[<h3>$[name]</h3>]]></text>
      </BalloonStyle>
    </Style>
    <StyleMap id="icon-1899-1A237E-nodesc">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1899-1A237E-nodesc-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1899-1A237E-nodesc-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="icon-1899-C2185B-normal">
      <IconStyle>
        <color>ff5b18c2</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
        <hotSpot x="32" xunits="pixels" y="64" yunits="insetPixels"/>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <Style id="icon-1899-C2185B-highlight">
      <IconStyle>
        <color>ff5b18c2</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
        <hotSpot x="32" xunits="pixels" y="64" yunits="insetPixels"/>
      </IconStyle>
      <LabelStyle>
        <scale>1</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="icon-1899-C2185B">
      <Pair>
        <key>normal</key>
        <styleUrl>#icon-1899-C2185B-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#icon-1899-C2185B-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Style id="line-C2185B-8894-normal">
      <LineStyle>
        <color>ff5b18c2</color>
        <width>8.894</width>
      </LineStyle>
    </Style>
    <Style id="line-C2185B-8894-highlight">
      <LineStyle>
        <color>ff5b18c2</color>
        <width>13.341</width>
      </LineStyle>
    </Style>
    <StyleMap id="line-C2185B-8894">
      <Pair>
        <key>normal</key>
        <styleUrl>#line-C2185B-8894-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#line-C2185B-8894-highlight</styleUrl>
      </Pair>
    </StyleMap>
    ${attractionsKML}
    ${accommodationKML}
    ${foodAndDrinkKML}
    ${shoppingKML}
    ${transportationKML}
    ${facilitiesKML}
    ${pathsKML}
  </Document>
</kml>
`;
