{
    pushd images/colors &> /dev/null
    echo 'import {Color} from "../../common/types";'
    echo 'export default {'
    for barva in Kule Listy Zaludy Srdce; do
        echo "    [Color.${barva}]: 'data:image/webp;base64,$(base64 -w0 ${barva}.webp)',"
    done
    echo '};'
} > src/client/images/color-images.ts
