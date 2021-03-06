1. 这个标准定义了表示浮点数的格式（包括负零-0）与反常值（denormal number）），一些特殊数值（无穷（Inf）与非数值（NaN）），以及这些数值的“浮点数运算符”；它也指明了四种数值舍入规则和五种例外状况（包括例外发生的时机与处理方式）；
2. 浮点数由尾数乘以某个基数的整数次幂得到的，类似于基数为 10 的科学记数法；
3. 二进制 1010 可表示为 `1.010 × 2 ^ 3`，`N=S×2^P`表示，其中 S 为尾数，P 为指数，2 为基数；
4. 双精度浮点数（64bit）：1 位符号位；8 位阶码；23 位尾数（整数位默认为 1）;
5. 双精度浮点数（32bit）：1 位符号位；11 位阶码；52 位尾数（整数位默认为 1）;
6. 为了简化计算过程，通过添加偏移值保持指数的正负值,偏移量为 `2 ^ (n - 1) - 1`（n 为阶码 bit 数），指数 = 阶码 - 偏移值；
7. 阶码的最大值和最小值存在特殊用途；
8. 浮点数的 5 种表示形式（n 表示阶码的 bit 长度） - 零（正负 0):阶码为 0，尾数为 0

    - 非规格化：阶码为 0，尾数非零（非规格划形式的浮点数的指数偏移值比规格化形式的浮点数的指数偏移值小 1，即`2 ^ (n-1) - 1`
    - 规格化：阶码`[1, 2 ^ n - 2]`,尾数任意
    - 无穷（正负）：阶码`2^n - 1`，尾数为零
    - NaN：阶码`2^n - 1`,尾数非零

9. 非规格化形式用于表示哪些非常接近于 0 的数，填补了绝对值意义下最小规格书与 0 的距离，避免了突然式下溢出，表示数据的完整性。
10. 单精度精度浮点数（32bit）

    - 8 位阶码，`2^8 = 256`,总共 256 个数,即`[0,255]`，偏移值为 127，则指数范围是`[-127, 128]`,去掉阶码的最小值和最大值，最终指数范围是[-126，127];
    - 所以单精度浮点数能够表示的范围是`[-1 * （2 - 2 ^ -23） * 2 ^ 127，1 * （2 - 2 ^ -23） * 2 ^ 127]`

11. 双精度浮点数（64bit）

    - 11 位阶码，`2^11 = 2048`,总共 2048 个数,即`[0,2047]`，偏移值为 1023，则指数范围是`[-1023, 1024]`,去掉阶码的最小值和最大值，最终指数范围是[-1022，1023];
    - 所以双精度浮点数能够表示的范围是`[-1 * （2 - 2 ^ -52） * 2 ^ 1023，1 * （2 - 2 ^ -52） * 2 ^ 1023]`.单精度浮点数各种极值情况：

<table>
    <tbody>
        <tr>
            <th>浮点数形式</th>
            <th>正负号</th>
            <th>有效数字</th>
            <th>实际指数</th>
            <th>表示数值</th>
        </tr>
        <tr>
            <td>负无穷</td>
            <td align="center">
                1
            </td>
            <td>1.0</td>
            <td align="right">128</td>
            <td>-∞</td>
        </tr>
        <tr>
            <td>规格化最大值</td>
            <td align="center">
                1
            </td>
            <td>2-2^-23</td>
            <td align="right">127</td>
            <td> -(2-2^-23)*2^127 = -3.4e+38</td>
        </tr>
        <tr>
            <td>规格化最小值</td>
            <td align="center">
                1
            </td>
            <td>1.0</td>
            <td align="right">
                -126
            </td>
            <td>-2^-126 = -1.18e-38(-1.17549435e-38)</td>
        </tr>
        <tr>
            <td>非规格化最大值</td>
            <td align="center">
                1
            </td>
            <td>1-2^-23</td>
            <td align="right">
                -126
            </td>
            <td>-(1-2^-23)*2^-126 = -1.18e-38(-1.17549421e-38)</td>
        </tr>
        <tr>
            <td>
                非规格化最小值
            </td>
            <td align="center">
                1
            </td>
            <td>2^-23</td>
            <td align="right">-126</td>
            <td>-2^-23*2^-126 = -1.4e-45</td>
        </tr>
        <tr>
            <td>负零</td>
            <td align="center">
                1
            </td>
            <td>小数部分是0</td>
            <td align="right">-127</td>
            <td>-0.0</td>
        </tr>
        <tr>
            <td>正零</td>
            <td align="center">
                0
            </td>
            <td>小数部分是0</td>
            <td align="right">-127</td>
            <td>+0.0</td>
        </tr>
        <tr>
            <td>非规格化最小值</td>
            <td align="center">
                0
            </td>
            <td>2^-23</td>
            <td align="right">
                -126
            </td>
            <td>2^-23*2^-126 = 1.4e-45</td>
        </tr>
        <tr>
            <td>非规格化最大值</td>
            <td align="center">
                0
            </td>
            <td>1-2^-23</td>
            <td align="right">
                -126
            </td>
            <td>(1-2^-23)*2^-126 = 1.18e-38(1.17549421e-38)</td>
        </tr>
        <tr>
            <td>规格化最小值</td>
            <td align="center">
                0
            </td>
            <td>1.0</td>
            <td align="right">
                -126
            </td>
            <td>2^-126 = 1.18e-38(1.17549435e-38)</td>
        </tr>
        <tr>
            <td>规格化最大值</td>
            <td align="center">
                0
            </td>
            <td>2-2^-23</td>
            <td align="right">
                127
            </td>
            <td>(2-2^-23)*2^127 = 3.4e+38</td>
        </tr>
        <tr>
            <td>
                正无穷
            </td>
            <td align="center">
                0
            </td>
            <td>小数部分是0</td>
            <td align="right">
                128
            </td>
            <td>+∞</td>
        </tr>
        <tr>
            <td>
                NaN
            </td>
            <td align="center">
                0或1
            </td>
            <td>小数部分非0</td>
            <td align="right">
                128
            </td>
            <td>NaN</td>
        </tr>
        <tr>
            <td colspan="7">
                规格化最大有效数字为2-2^-23
            </td>
        </tr>
    </tbody>
</table>
