import {Color, Value} from "./common/types"

export const CARDS_GENITIVE: {[key in keyof typeof Color]: {[key2 in keyof typeof Value]: string}} = {
    [Color.Kule]: {
        [Value.Sedmicka]: "kulou sedmu",
        [Value.Osmicka]: "kulovou osmičku",
        [Value.Devitka]: "kulovou devítku",
        [Value.Desitka]: "kulovou desítku",
        [Value.Spodek]: "kulovýho spodka",
        [Value.Svrsek]: "kulovýho svrška",
        [Value.Kral]: "kulovýho krále",
        [Value.Eso]: "kulový eso",
    },
    [Color.Listy]: {
        [Value.Sedmicka]: "listovou sedmu",
        [Value.Osmicka]: "listovou osmičku",
        [Value.Devitka]: "listovou devítku",
        [Value.Desitka]: "listovou desítku",
        [Value.Spodek]: "listovýho spodka",
        [Value.Svrsek]: "listovýho svrška",
        [Value.Kral]: "listovýho krále",
        [Value.Eso]: "listový eso",
    },
    [Color.Zaludy]: {
        [Value.Sedmicka]: "žaludovou sedmu",
        [Value.Osmicka]: "žaludovou osmičku",
        [Value.Devitka]: "žaludovou devítku",
        [Value.Desitka]: "žaludovou desítku",
        [Value.Spodek]: "žaludovýho spodka",
        [Value.Svrsek]: "žaludovýho svrška",
        [Value.Kral]: "žaludovýho krále",
        [Value.Eso]: "žaludový eso",
    },
    [Color.Srdce]: {
        [Value.Sedmicka]: "srdcovou sedmu",
        [Value.Osmicka]: "srdcovou osmičku",
        [Value.Devitka]: "srdcovou devítku",
        [Value.Desitka]: "srdcovou desítku",
        [Value.Spodek]: "srdcovýho spodka",
        [Value.Svrsek]: "srdcovýho svrška",
        [Value.Kral]: "srdcovýho krále",
        [Value.Eso]: "srdcový eso",
    }
}
