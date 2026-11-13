/* [MODULE_INFO_START]
 * Class: GemmScoreboard
 * Role: independent scalar reference for the fixed 2x2 smoke-test matrix.
 * [MODULE_INFO_END] */
class GemmScoreboard;
    virtual function int expected(input int row, input int col);
        int result;
        result = 0;
        for (int k=0; k<2; k++) result += (row*2+k+1)*(5+k*2+col);
        return result;
    endfunction
    virtual function void check(input int row, input int col, input int observed);
        assert_gemm_value: assert (observed == expected(row,col))
            else $fatal(1,"GEMM mismatch row=%0d col=%0d expected=%0d got=%0d",
                        row,col,expected(row,col),observed);
    endfunction
endclass
