{
    pushd images/karty &> /dev/null
    cat template
    for barva in Kule Listy Zaludy Srdce; do
        echo "    [Color.${barva}]: {"
        for cislo in Sedmicka Osmicka Devitka Desitka Spodek Svrsek Kral Eso; do
            echo "        [Value.${cislo}]: 'data:image/png;base64,$(base64 -w0 ${barva}.${cislo}.compressed.png)',"
        done
        echo "    },"
    done
    echo "}"
} > src/card-images.ts
