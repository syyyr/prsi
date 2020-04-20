{
    pushd images/karty &> /dev/null
    echo 'import {Color, Value} from "../../common/types";'
    echo 'export default {'
    for barva in Kule Listy Zaludy Srdce; do
        echo "    [Color.${barva}]: {"
        for cislo in Sedmicka Osmicka Devitka Desitka Spodek Svrsek Kral Eso; do
            echo "        [Value.${cislo}]: 'data:image/webp;base64,$(base64 -w0 ${barva}.${cislo}.webp)',"
        done
        echo "    },"
    done
    echo "}"
} > src/client/images/card-images.ts
