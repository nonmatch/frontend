import { Container } from "../components/Container"
import { PieChart, Pie, Tooltip, Cell } from 'recharts';
import { useEffect, useState } from "react";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { get } from "../api";
import {Func} from "../types";
import { useHistory } from "react-router";
import { useTitle } from "../utils";


export const StatsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [chartDataFiles, setChartDataFiles] = useState([]);
    const [chartDataFunctions, setChartDataFunctions] = useState([]);
    const [chartDataGeneral, setChartDataGeneral] = useState([]);
    const [generalStats, setGeneralStats] = useState({count:0, size:0, percent:0});

    const TOTAL_BYTES = 649372;

    const percentFormatter = new Intl.NumberFormat('default', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const history = useHistory();

    const fetchFunctions = async () => {
        setIsLoading(true);

        get(API_URL + '/func_stats').then(
            async (data) => {
                setIsLoading(false);
                let remainingData: Func[] = [];

                let asmSize = 0;
                let nonmatchSize = 0;
                let matchedSize = 0;
                for (const entry of data) {
                    if (entry.is_matched || entry.decomp_me_matched) {
                        matchedSize += entry.size;
                    } else {
                        remainingData.push(entry);
                        if (entry.is_asm_func) {
                            asmSize += entry.size;
                        } else {
                            nonmatchSize += entry.size;
                        }
                    }
                }
                setChartDataGeneral([
                    {
                        name: 'ASM_FUNC',
                        value: asmSize,
                        color: '#ea4335'
                    },
                    {
                        name: 'NONMATCH',
                        value: nonmatchSize,
                        color: '#ff6d01'
                    },
                    {
                        name: 'Matched, but not submitted',
                        value: matchedSize,
                        color: '#fbbc04'
                    },
                    {
                        name: 'Decompiled',
                        value: TOTAL_BYTES - asmSize - nonmatchSize - matchedSize,
                        color: '#34a853'
                    },
                ] as any)

                remainingData.sort((a: any, b: any) => b.size - a.size);
                setChartData(remainingData.map((func: Func) => {
                    return { name: func.name, value: func.size, id: func.id };
                }) as any);

                let byFile: Map<string, any> = new Map<string, any>();
                for (const func of remainingData) {
                    if (!byFile.has(func.file)) {
                        byFile.set(func.file, { name: func.file, value: 0, funcs: [] });
                    }
                    byFile.get(func.file).value += func.size;
                    byFile.get(func.file).funcs.push({ name: func.name, value: func.size, id: func.id });
                }
                let byFileList: any = Array.from(byFile.values());
                byFileList.sort((a: any, b: any) => b.value - a.value);
                setChartDataFiles(byFileList);

                let funcList: any = [];
                let index = 0;
                for (const entry of byFileList) {
                    entry.funcs.sort((a: any, b: any) => b.size - a.size);
                    for (const func of entry.funcs) {
                        func.colorIndex = index;
                        funcList.push(func);
                    }
                    index++;
                }
                setChartDataFunctions(funcList);


                // Calculate general stats.
                let count = 0;
                let size = 0;
                for (const func of remainingData) {
                    count++;
                    size += func.size;
                }
                let percent = size / TOTAL_BYTES;
                setGeneralStats({
                    count,
                    size,
                    percent
                });
            }
        );
    };

    const onFunctionClick = (index: any, data: any) => {
        history.push('/functions/' + index.payload.id);
    };

    useEffect(() => {
        fetchFunctions();
        // eslint-disable-next-line
    }, []);

    useTitle('NONMATCH Stats');

    const COLORS = [
        '#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01',
        '#46bdc6', '#7baaf7', '#f07b72', '#fcd04f', '#71c287',
        '#ff994d', '#7ed1d7', '#b3cefb', '#f7b4ae'
    ];

    return (<Container>
        <h1 className="mt-4">Stats</h1>
        {isLoading ?
            <LoadingIndicator /> :
            <>
            <p>There are {generalStats.count} functions left with a size of {generalStats.size} bytes accounting for {percentFormatter.format(generalStats.percent)}.</p>
            <div style={
                {
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '25px',
                    flexWrap: 'wrap'
                }
            }>
                <PieChart width={250} height={280} >
                    <text x={120} y={25} fill="black" textAnchor="middle">
                        Total Progress
                    </text>
                    <Pie
                        dataKey="value"
                        cx={120}
                        cy={150}
                        outerRadius={120}
                        innerRadius={40}
                        startAngle={450}
                        endAngle={90}
                        isAnimationActive={false}
                        legendType='line'
                        data={chartDataGeneral}
                    >
                        {chartDataGeneral.map((entry: any, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip isAnimationActive={false} formatter={(value: number) => {
                        return `${value} (${percentFormatter.format(value/TOTAL_BYTES)})`;
                    }}/>
                </PieChart>

                <PieChart width={250} height={280} >
                    <text x={120} y={25} fill="black" textAnchor="middle">
                        Open Functions by Size
                    </text>
                    <Pie
                        dataKey="value"
                        data={chartData}
                        cx={120}
                        cy={150}
                        outerRadius={120}
                        innerRadius={40}
                        startAngle={450}
                        endAngle={90}
                        isAnimationActive={false}
                        legendType='line'
                        onDoubleClick={onFunctionClick}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>

                    <Tooltip isAnimationActive={false} formatter={(value: number) => {
                        return `${value} (${percentFormatter.format(value/TOTAL_BYTES)})`;
                    }}/>
                </PieChart>
                <PieChart width={250} height={280} >

                    <text x={120} y={15} fill="black" textAnchor="middle">
                        Open Files by Size
                    </text>
                    <text x={120} y={30} fill="gray" textAnchor="middle" fontSize={10}>
                        Outer Ring: Functions in that File
                    </text>
                    <Pie
                        dataKey="value"
                        cx={120}
                        cy={150}
                        outerRadius={90}
                        innerRadius={40}
                        startAngle={450}
                        endAngle={90}
                        isAnimationActive={false}
                        legendType='line'
                        data={chartDataFiles}
                    >
                        {chartDataFiles.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>

                    <Pie
                        dataKey="value"
                        cx={120}
                        cy={150}
                        outerRadius={120}
                        innerRadius={90}
                        startAngle={450}
                        endAngle={90}
                        isAnimationActive={false}
                        legendType='line'
                        data={chartDataFunctions}
                        onDoubleClick={onFunctionClick}
                    >
                        {chartDataFunctions.map((entry: any, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex % COLORS.length]} />
                        ))}
                    </Pie>

                    <Tooltip isAnimationActive={false} formatter={(value: number) => {
                        return `${value} (${percentFormatter.format(value/TOTAL_BYTES)})`;
                    }}/>
                </PieChart>
            </div>
            <p style={{color: "#777"}}>Double click on pie chart sections to go to that function.</p>
            </>
        }
    </Container>);
}