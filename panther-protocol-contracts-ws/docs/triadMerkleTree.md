## Triad Binary Tree

The **"triad binary tree"** is a modified Merkle binary tree, such that:

-   every node, from the root up to the level preceding leaves, and excluding
    that level, has 2 child nodes (i.e. this subtree is a full binary tree);
-   every node of the level preceding leaves has 3 child nodes (in other words,
    there are 3 leaves on the last level).

> We use tries with the number of levels, excluding the root level, being
> `TREE_DEPTH = 15`
>
> The number of leaves in a tree is
> `LEAVES_NUM = (2 ** (TREE_DEPTH - 1)) * 3 = 49152`
>
> The number of triads in a tree is
> `2 ** (TREE_DEPTH - 1) = 16384`

Example:

<pre>
- Number in a root/node/leaf position is the "node/leaf index"
  It starts from 0 for the leftmost node/leaf of every level
- Number in [] is the "level index" that starts from 0 for the leaves level
- TREE_DEPTH = 4
[4]                              0
                                 |
[3]               0-------------------------------1
                  |                               |
[2]       0---------------1                2--------------3
          |               |                |              |
[1]   0-------1       2-------3       4-------5       6-------7
     /|\     /|\     /|\     /|\     /|\     /|\     /|\     /|\
[0]  0..2    3..5    6..8    9..11  12..14  15..17  18..20  21..24
</pre>

_Let's assume:_

`C` - leaf being inserted;
`L` - leaf, a neighbour of `C` and `R` in the triad, to the left from the `R`;
`R` - leaf, a neighbour of `C` and `L` in the triad, to the right from the `L`;

`l` - level index (0 for leaves);
`i` - leaf index (0 for the leftmost leaf);
`t` - position of `C` in the triad:

> t=0, if `C` is the leftmost leaf
> t=1, if `C` is the middle leaf
> t=2, if `C` is the rightmost leaf

`bH` and `bL` - bit representation of `t` (`bL` is the lower bit, `bH` is the higher);

(`n1`, `n2`, `n3`) - input to the hash function for the subtree from the triad.

_Then:_

<pre>
(I):
t = i % 3

(II):
t |bH  bL| Subtree
--|------|------------
0 | 0  0 | hash(C,L,R)
1 | 0  1 | hash(L,C,R)
2 | 1  0 | hash(L,R,C)
3 | 1  1 | Not allowed
--|------|------------

(III):                      
n1 = C + (bl+bh)*(L - C)
n2 = L + bl*(C - L) + bh*(R - L)
n3 = R + bh*(C - R)
</pre>

## Modified (or "triad") leaf index

It is the leaf index in an imaginary binary full tree, where every forth leaf
skipped (as if a quad with one skipped leaf is inserted instead of a triad).

> Max leaf index for the `TREE_DEPTH` of 15 is 49151;
> Max triad leaf index for the `TREE_DEPTH` of 15 is 65534 (16 bits).

<pre>
i' = (i\3)<<2 | (i%3)
where
i' - modified (or "triad") leaf index
i - leaf index
and where,
  \ - integer division
  <<2 - bit shift by 2 (equivalent to *=4)
  % - mod (reminder)
  | - bitwise OR
</pre>

```javascript
const leafIndTriadInd = i => (Math.floor(i / 3) << 2) | i % 3;
const triadInd2LeafInd = i => (i >> 2) * 3 + (i % 3);
```

## Modified (or "triad") path elements

We take path elements for levels `l` from `1` to `TREE_DEPTH-1`, both inclusive,
and prepend if with `R` and `L` (so the `R` has the index of 0 in the array):

<pre>
P' = Array(R, L, P..)
where
P' - Modified (or "triad") path elements
P = Array(path elements for `l` from 1 to TREE_DEPTH-1, both inclusive);
</pre>

## Passing Merkle proof to the circuit

For every input UTXO, we pass the Merkle proof being:

-   triad leaf index, `i'`, and ...
-   ... triad path elements, `P'`

> `i'` is an integer of 0..65534
> `P'` consists of 16 elements

## Merkle proof verification in the circuit

1. Having `i'`, using `(I)`, calculate `t`;
2. Having `P'[0]`, `P'[1]` (i.e. `R`, `L`), `C` and `t`, using `(III)`
   calculate `n1`, `n2`, `n3` and (hash of) the node on the level `l = 1`;
3. For the subtree that starts from the level `l = 1`, up to the root,
   being the binary Merkle tree, compute the proof with path indices `i'/3`
   and the path elements `P'[2]` .. `P'[TREE_DEPTH]`.
