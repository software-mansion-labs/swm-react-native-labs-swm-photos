import { Image } from "expo-image";
import { PlaceholderProps } from "./types";

/**
 * These are 7 pregenerated blurhashes for our sample photos.
 * We've generated them using: https://blurha.sh/.
 */
const PLACEHOLDER_BLURHASHES: string[] = [
  ":rFGXp~q$%RPRjbIofayV@bHazayogoff5axNHR-t7xaaeV@ayfkWBj[ofaeaeayofofoMbIj]ofoff6WBWBWBayj[oeoff6WAWVWBayofogj[oeoLWBj[j]fQayj[jsjZfk",
  ":WDvs3EQMxt7NHt6Rkj@_4I]RQofR*oeWCjsXSt8oga~WBfRofj[9bxZozWrocWXj[bGIVn#oza~oLbHj?WVWAV@a{oKaza}jufkskR+V@j=a}oJbHj[s+ofWAWBfljZWWoK",
  ":wJu7TxaWVt6j[j[jsfk~qofWBf6ayj[ayj[E2aef6WVayj@fkjtE2oLbHofj[f6j[ayNHoLWBf6a}a|ayj[WCj[jsayj[j[juj[j@ayj[j[f6ayj[ayj[WVa|ayfQa}fPj[",
  ":OHD2C9EM{tRM{t7juWBD4n$WAofjZayj]ayO[%Mf5WVa}axt6WC00Wos.ofjsWBayj[00xZj?bIs:WBWBj[=_9FWBt7WBf6azkCyDfSoLWBWCjsj[j[~W%NNGM{ofjsaya}",
  ":MNKYT-=xuITM{ogayRi0%9ZNG%MRjWBoft6yER-D%WC%MWAWBWC_ND%xuRjR*t7Rjt79Gxu%MRjRjofj@WB9GofM{t7s:Rjt7Rj9GRjV@jss:j[j[j@WBofoeayaet7ayoL",
  ":CBghnay00oy^-WTD$s;.5t7NHWmRixv%MM{jwjbtPj@Ria{xbj]%ek9otjvV_R%Rlt7M}WXfinloxV]V]f6jdV]oJbFoeRkWUe=R*off7oMRkWCofaft6k9kBofahRkWCs;",
  ":YIWJ$oMf8xtxFE3NHxD~UNdoft7oJRjWBoJkXfkt7ofo0WBR+WVWEWXbbofoKWCWVjZR+NbR+W;kCfkoJj@jFayafo0oeofjsj[Rjjsjsn%jZofa}bHRkayoJayWCbHfkfk",
];

// PlaceholderBlurhash component
export const PlaceholderBlurhash = ({ size, index }: PlaceholderProps) => {
  return (
    <Image
      source={{
        blurhash: PLACEHOLDER_BLURHASHES[index % PLACEHOLDER_BLURHASHES.length],
      }}
      style={{ width: size, height: size }}
    />
  );
};
