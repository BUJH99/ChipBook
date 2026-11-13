/* [MODULE_INFO_START]
 * Module: TbTop
 * Purpose: GEMM reference/stall/reset smoke test and DMA/FIFO byte conservation.
 * Run: see run_examples.py. Completion is a PASS line; watchdog is a failure.
 * [MODULE_INFO_END] */
`timescale 1ns/1ps
`include "GemmScoreboard.svh"
module TbTop;
    logic Clk=1'b0, Rstn=1'b0;
    logic Start=1'b0, StepEn=1'b1, Busy, Done;
    logic signed [7:0] MatrixA [2][2], MatrixB [2][2];
    logic signed [31:0] MatrixC [2][2];
    logic DmaStart=1'b0, DmaErr=1'b0, InValid=1'b0, InReady;
    logic [7:0] InData='0, OutData;
    logic OutValid, OutReady=1'b0, DmaBusy, DmaDone, DmaError;
    int Sent=0, Received=0;
    GemmScoreboard gemmScoreboard;
    SystolicCore uCore (.iClk(Clk),.iRstn(Rstn),.iStart(Start),.iStepEn(StepEn),
        .iMatrixA(MatrixA),.iMatrixB(MatrixB),.oMatrixC(MatrixC),.oBusy(Busy),.oDone(Done));
    TOP uSubsystem (.iClk(Clk),.iRstn(Rstn),.iStart(DmaStart),.iLength(16'd32),.iErr(DmaErr),
        .iValid(InValid),.iData(InData),.oReady(InReady),.oValid(OutValid),.oData(OutData),
        .iReady(OutReady),.oBusy(DmaBusy),.oDone(DmaDone),.oErr(DmaError));
    initial forever #5 Clk=~Clk;
    initial begin repeat(3) @(negedge Clk); Rstn=1'b1; end
    initial begin #100000; $fatal(1,"Watchdog timeout"); end
    initial begin $dumpfile("examples.vcd"); $dumpvars(0,TbTop); end
    initial begin
        gemmScoreboard=new;
        for(int row=0;row<2;row++) for(int col=0;col<2;col++) begin
            MatrixA[row][col]=8'(row*2+col+1);
            MatrixB[row][col]=8'(5+row*2+col);
        end
        wait(Rstn);
        @(negedge Clk); Start=1'b1;
        @(negedge Clk); Start=1'b0;
        repeat(2) @(negedge Clk);
        StepEn=1'b0;
        repeat(3) begin
            @(negedge Clk);
            assert_no_done_during_stall: assert(!Done) else $fatal(1,"Done during stall");
        end
        StepEn=1'b1;
        wait(Done); @(negedge Clk);
        for(int row=0;row<2;row++) for(int col=0;col<2;col++) gemmScoreboard.check(row,col,MatrixC[row][col]);
        DmaStart=1'b1;
        @(negedge Clk); DmaStart=1'b0;
        for(int cycle=0;cycle<200 && Received<32;cycle++) begin
            InValid=Sent<32; InData=8'(Sent); OutReady=(cycle%3)!=0;
            @(posedge Clk);
            if(InValid && InReady) Sent++;
            if(OutValid && OutReady) begin
                assert_byte_order: assert(OutData==8'(Received)) else $fatal(1,"FIFO byte loss/reorder");
                Received++;
            end
            @(negedge Clk);
        end
        assert_byte_conservation: assert(Sent==32 && Received==32 && !DmaError) else $fatal(1,"DMA count error");
        InValid=1'b0;
        $display("PASS: 2x2 GEMM, stall handling, 32-byte DMA/FIFO ordering");
        $finish;
    end
endmodule
