pragma circom 2.0.0;
include "../../circuits/transaction.circom";

component main{public [publicInputsHash]} = Transaction(2,2,16,7);