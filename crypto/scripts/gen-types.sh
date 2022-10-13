#!/bin/bash

TYPEDIR=typing

emit_types() {
    local module="$1"
    local outdir=$TYPEDIR/$module
    if [[ -z $force_rebuild ]] && [[ -d $outdir ]]; then
        return
    fi

    mkdir -p $outdir

    yarn tsc \
        --declaration \
        --emitDeclarationOnly \
        --esModuleInterop \
        --allowJs \
        --skipLibCheck \
        --outdir $outdir \
        ../node_modules/$module/{,**/}*.js

    if [[ -e $outdir/main.d.ts ]]; then
        echo mv $outdir/{main,index}.d.ts
        mv $outdir/{main,index}.d.ts
    fi

    echo "Wrote types to $outdir"
}

tweak_ffjavascript() {
    # FIXME: figure out how to configure tsc so that this is not needed
    outdir=$TYPEDIR/ffjavascript
    f1=$outdir/src/f1field.d.ts
    if [ ! -e "$f1" ]; then
        echo >&2 "ERROR: $f1 missing"
        exit 1
    fi
    (
        if ! grep -q 'import F1Field_bigint' $f1; then
            echo 'import F1Field_bigint from "./f1field_bigint.js";'
            echo
        fi
        cat $f1
    ) > $f1.new
    perl -pe 's/^(export default class F1Field) \{/$1 extends F1Field_bigint {/' \
        $f1.new \
        > $f1
}

main() {
    if [[ -n $1 ]]; then
        force_rebuild=yes
    fi

    emit_types snarkjs

    emit_types circomlibjs
    # This is needed to avoid errors unless we have --skipLibCheck:
    # rm $TYPEDIR/circomlibjs/src/smt.d.ts

    # FIXME: remove this monkey-patch when this PR is merged:
    # https://github.com/iden3/ffjavascript/pull/25
    perl -pi -e 's/(^class ThreadManager \{)/export $1/' ../node_modules/ffjavascript/src/threadman.js
    emit_types ffjavascript
    tweak_ffjavascript
}

main "$@"
