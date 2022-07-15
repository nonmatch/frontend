import { Container } from "../components/Container"
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEffect, useState } from "react";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { API_URL } from "../constants";
import { get } from "../api";



export const StatsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [chartDataFiles, setChartDataFiles] = useState([]);
    const [chartDataFunctions, setChartDataFunctions] = useState([]);


    const fetchFunctions = async () => {
        setIsLoading(true);

        get(API_URL+'/all_functions').then(
            async (data) => {
                setIsLoading(false);
                console.log(data);
                data.sort((a:any, b:any) => b.size - a.size);
                setChartData(data.map((func:any) => {
                    return {name: func.name, value: func.size};
                }));

                let byFile: Map<string, any> = new Map<string, any>();
                for (const func of data) {
                    
                    if (!byFile.has(func.file)) {
                        byFile.set(func.file, {name: func.file, value:0, funcs: []});
                    }
                    byFile.get(func.file).value += func.size;
                    byFile.get(func.file).funcs.push({name: func.name, value: func.size});
                }
                let byFileList: any = Array.from(byFile.values());
                byFileList.sort((a:any, b:any) => b.value-a.value);
                setChartDataFiles(byFileList);

                let funcList: any = [];
                let index = 0;
                for (const entry of byFileList) {
                    entry.funcs.sort((a:any, b:any) => b.size - a.size);
                    for (const func of entry.funcs) {
                        func.colorIndex = index;
                        funcList.push(func);
                    }
                    index++;
                }
                setChartDataFunctions(funcList);
                console.log(byFile);
            }
        );
    };

    useEffect(() => {
        fetchFunctions();
        // eslint-disable-next-line
    }, []);
    const COLORS = [
        '#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01',
        '#46bdc6', '#7baaf7', '#f07b72', '#fcd04f', '#71c287',
        '#ff994d', '#7ed1d7', '#b3cefb', '#f7b4ae'
    ];

    return (<Container>
        <h1 className="mt-4">Stats</h1>
{        isLoading ?
        <LoadingIndicator />:
        <ResponsiveContainer width="100%" height={300}>
            <PieChart width={400} height={400}>
                <Pie
                    dataKey="value"
                    data={chartData}
                    cx={150}
                    cy={150}
                    outerRadius={100}
                    innerRadius={40}
                    startAngle={450}
                    endAngle={90}
                    isAnimationActive={false}
                    legendType='line'
                    >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>

                <Pie
                    dataKey="value"
                    cx={400}
                    cy={150}
                    outerRadius={80}
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
                    cx={400}
                    cy={150}
                    outerRadius={100}
                    innerRadius={80}
                    startAngle={450}
                    endAngle={90}
                    isAnimationActive={false}
                    legendType='line'
                    data={chartDataFunctions}
                    >
                    {chartDataFunctions.map((entry: any, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip isAnimationActive={false} />
            </PieChart>
        </ResponsiveContainer>
}
    </Container>);
}