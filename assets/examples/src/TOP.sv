/* [MODULE_INFO_START]
 * Module: TOP
 * Purpose: minimal ready/valid subsystem; DMA feeds a FIFO.
 * Contract: DMA Done means all bytes entered the FIFO, not that the sink consumed them.
 * [MODULE_INFO_END] */
module TOP (
    input logic iClk, input logic iRstn,
    input logic iStart, input logic [15:0] iLength, input logic iErr,
    input logic iValid, input logic [7:0] iData, output logic oReady,
    output logic oValid, output logic [7:0] oData, input logic iReady,
    output logic oBusy, output logic oDone, output logic oErr
);
    logic TransferValid, TransferReady;
    logic [7:0] TransferData;
    logic [15:0] Accepted;
    logic [2:0] FifoCount;
    StreamDma uDma (
        .iClk(iClk), .iRstn(iRstn), .iStart(iStart), .iLength(iLength), .iErr(iErr),
        .iValid(iValid), .iData(iData), .oReady(oReady), .oValid(TransferValid),
        .oData(TransferData), .iReady(TransferReady), .oBusy(oBusy), .oDone(oDone),
        .oErr(oErr), .oAccepted(Accepted)
    );
    ReadyValidFifo uFifo (
        .iClk(iClk), .iRstn(iRstn), .iValid(TransferValid), .iData(TransferData),
        .oReady(TransferReady), .oValid(oValid), .oData(oData), .iReady(iReady), .oCount(FifoCount)
    );
endmodule
