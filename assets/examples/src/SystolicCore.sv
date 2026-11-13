/* [MODULE_INFO_START]
 * Module: SystolicCore
 * Purpose: N x N INT8 GEMM, INT32 accumulation, skewed logical schedule.
 * Contract: P_SIZE=2..4. Start is accepted only while idle. Inputs are latched.
 *           iStepEn=0 freezes all in-flight work. Done pulses for one clock.
 * Note: parallel matrix ports are an educational boundary, not an SRAM PHY.
 * [MODULE_INFO_END] */
module SystolicCore #(
    parameter int P_SIZE = 2
) (
    input  logic iClk,
    input  logic iRstn,
    input  logic iStart,
    input  logic iStepEn,
    input  logic signed [7:0] iMatrixA [P_SIZE][P_SIZE],
    input  logic signed [7:0] iMatrixB [P_SIZE][P_SIZE],
    output logic signed [31:0] oMatrixC [P_SIZE][P_SIZE],
    output logic oBusy,
    output logic oDone
);
    localparam int LP_LAST_CYCLE = 3 * P_SIZE - 3;
    localparam int LP_CYCLE_WIDTH = $clog2(LP_LAST_CYCLE + 2);
    typedef enum logic { IDLE, RUN } state_e;
    state_e State;
    logic [LP_CYCLE_WIDTH-1:0] Cycle;
    logic signed [7:0] MemA [P_SIZE][P_SIZE];
    logic signed [7:0] MemB [P_SIZE][P_SIZE];
    logic signed [15:0] Product [P_SIZE][P_SIZE];
    logic ProductValid [P_SIZE][P_SIZE];

    assign oBusy = State == RUN;
    always_comb begin
        for (int idxRow = 0; idxRow < P_SIZE; idxRow++) begin
            for (int idxCol = 0; idxCol < P_SIZE; idxCol++) begin
                Product[idxRow][idxCol] = '0;
                ProductValid[idxRow][idxCol] = 1'b0;
                for (int idxK = 0; idxK < P_SIZE; idxK++) begin
                    if (int'(Cycle) == idxRow + idxCol + idxK) begin
                        Product[idxRow][idxCol] = MemA[idxRow][idxK] * MemB[idxK][idxCol];
                        ProductValid[idxRow][idxCol] = 1'b1;
                    end
                end
            end
        end
    end
    always_ff @(posedge iClk or negedge iRstn) begin
        if (!iRstn) begin
            State <= IDLE;
            Cycle <= '0;
            oDone <= 1'b0;
            for (int idxRow = 0; idxRow < P_SIZE; idxRow++) begin
                for (int idxCol = 0; idxCol < P_SIZE; idxCol++) begin
                    MemA[idxRow][idxCol] <= '0;
                    MemB[idxRow][idxCol] <= '0;
                    oMatrixC[idxRow][idxCol] <= '0;
                end
            end
        end else begin
            oDone <= 1'b0;
            unique case (State)
                IDLE: if (iStart) begin
                    State <= RUN;
                    Cycle <= '0;
                    for (int idxRow = 0; idxRow < P_SIZE; idxRow++) begin
                        for (int idxCol = 0; idxCol < P_SIZE; idxCol++) begin
                            MemA[idxRow][idxCol] <= iMatrixA[idxRow][idxCol];
                            MemB[idxRow][idxCol] <= iMatrixB[idxRow][idxCol];
                            oMatrixC[idxRow][idxCol] <= '0;
                        end
                    end
                end
                RUN: if (iStepEn) begin
                    for (int idxRow = 0; idxRow < P_SIZE; idxRow++) begin
                        for (int idxCol = 0; idxCol < P_SIZE; idxCol++) begin
                            if (ProductValid[idxRow][idxCol])
                                oMatrixC[idxRow][idxCol] <= oMatrixC[idxRow][idxCol]
                                    + {{16{Product[idxRow][idxCol][15]}}, Product[idxRow][idxCol]};
                        end
                    end
                    if (int'(Cycle) == LP_LAST_CYCLE) begin
                        State <= IDLE;
                        oDone <= 1'b1;
                    end else Cycle <= Cycle + 1'b1;
                end
                default: State <= IDLE;
            endcase
        end
    end
endmodule
