// Dimensions and margins
const margin = { top: 50, right: 50, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Helper function to wrap text
function wrap(text, width) {
    text.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse(); // split text into words
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // em units for line spacing
        const x = text.attr("x");
        const y = text.attr("y");
        const dy = 0; // adjust if you want initial vertical offset
        let tspan = text.text(null).append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            // Check if the line exceeds the specified width
            if (tspan.node().getComputedTextLength() > width) {
                // Remove the last word and start a new line
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", lineHeight + "em")
                    .text(word);
            }
        }
    });
}

// Define legend dimensions
const legendX = 20;
const legendY = height - 100;
const legendSpacing = 20;
let selectedRace = null;
let selectedState = "all";
const highOpacity = 0.7;
const lowOpacity = 0.1;


// Define color scale for races
const colorScale = d3.scaleOrdinal()
.domain(["White", "Black", "Asian", "Hispanic"])
.range(["steelblue", "darkorange", "green", "purple"]); // Custom colors for each race
const svg = d3.select("#scatterplot")
.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`);



// Highlight circles for the selected race
function highlightRace(race) {
    d3.selectAll(".samples")
        .transition()
        .duration(200)
        .attr("opacity", d => (d.Race === race ? highOpacity : lowOpacity)); // Highlight matching circles
}

// Highlight circles for the selected state
function highlightState(state) {
    d3.selectAll(".samples")
    .transition()
    .duration(200)
    .attr("opacity", p => (p.State === state ? highOpacity : lowOpacity))
    .attr("stroke", p => (p.State === state ? "black": null))
    .attr("stroke-width", 2);
}


function updateTooltip(event, d, stateStats) {
    // Correct tooltip positioning relative to the SVG
    const raceStats = stateStats.map(
        p => `
            <div style="border-bottom: 1px solid #ddd; padding: 5px 0;">
                <strong>${p.Race}</strong>
                <span style="float: right; color: ${colorScale(p.Race)}; font-weight: bold;">
                    ${p.DiffPercentLAPOP1_10 > 0 ? '+' : ''}${p.DiffPercentLAPOP1_10.toFixed(1)}%
                </span>
            </div>` 
    );

    // Show and update the tooltip
    d3.select("#tooltip_george").style("display", "block")
    .style("width", "100px") // Fixed width
    .style("word-wrap", "break-word") // Wrap long text
    .html(`
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333;">
            ${d.State}
        </div>
        <div style="padding: 5px 0;">
            <strong>Avg.</strong>
            <span style="float: right; color: crimson; font-weight: bold;">
                ${(d.PercentLAPOP1_10 - d.DiffPercentLAPOP1_10).toFixed(1)}%
            </span>
        </div> 
        <div style="padding-bottom: 5px; font-size: 6px; color: #666; text-align: right;">
                PERCENT AHEAD
            </div>
        ${raceStats.join("")}
    `)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY + 10}px`);
    // .html(`
    //     <strong>State:</strong> ${d.State}<br>
    //     <strong>Median Family Income:</strong> $${(d.MedianFamilyIncome / 1000).toFixed(1)}k<br>
    //     <strong>Population:</strong> ${Math.round(d.Population / 1000)}k<br>
    //     <strong>Percent LA:</strong> ${(d.PercentLAPOP1_10 - d.DiffPercentLAPOP1_10).toFixed(1)}%<br>
    //     ${raceStats.join("<br>")}
    // `)
    // .style("left", `${event.pageX + 10}px`)
    // .style("top", `${event.pageY + 10}px`);
}

// Reset circle opacity
function resetHighlight() {
    d3.selectAll(".samples")
        .transition()
        .duration(200)
        .attr("opacity", 0.7); // Reset to default opacity
}

function resetAll() {
    selectedRace = null;
    resetHighlight();
    d3.selectAll(".legend").selectAll("rect")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);
    d3.selectAll(".legend").selectAll("text")
        .style("font-weight", "normal");
}


d3.csv("FoodAccessResearchAtlasData2019.csv").then(function(data) {
    // Parse data
    data = data.filter(d => {
        const income = +d.MedianFamilyIncome;
        const LAPOP1_10 = +d.LAPOP1_10;
        const population = +d.Pop2010;
        return (!isNaN(income) && !isNaN(population) && !isNaN(LAPOP1_10)) && (income > 0 && population > 0 && LAPOP1_10 > 100);
    })
    .map(d => ({
        State: d.State,
        County: d.County,
        Urban: +d.Urban,
        MedianFamilyIncome: +d.MedianFamilyIncome,
        LAPOP1_10: +(isNaN(d.Urban == 1 ? d.lapophalf : d.lapop10) ? 0 : (d.Urban == 1 ? d.lapophalf : d.lapop10)),
        Population: +d.Pop2010,
        lawhite1_10: +(isNaN(d.Urban == 1 ? d.lawhitehalf : d.lawhite10) ? 0 : (d.Urban == 1 ? d.lawhitehalf : d.lawhite10)),
        lablack1_10: +(isNaN(d.Urban == 1 ? d.lablackhalf : d.lablack10) ? 0 : (d.Urban == 1 ? d.lablackhalf : d.lablack10)),
        laasian1_10: +(isNaN(d.Urban == 1 ? d.laasianhalf : d.laasian10) ? 0 : (d.Urban == 1 ? d.laasianhalf : d.laasian10)),
        lahisp1_10: +(isNaN(d.Urban == 1 ? d.lahisphalf : d.lahisp10) ? 0 : (d.Urban == 1 ? d.lahisphalf : d.lahisp10)),
        WhitePop: +d.TractWhite,
        BlackPop: +d.TractBlack,
        HispPop: +d.TractHispanic,
        AsianPop: +d.TractAsian,
    }));
    const aggregatedData = Array.from(
        d3.group(data, d => `${d.State}`), // Group by State-County combination
        ([key, values]) => {
            const state = values[0].State;
            const county = values[0].County;

            // Aggregate MedianFamilyIncome and Population
            const totalLAPOP1_10 = d3.sum(values, v => +v.LAPOP1_10);
            const totalWhiteLAPop1_10 = d3.sum(values, v => +v.lawhite1_10);
            const totalBlackLAPop1_10 = d3.sum(values, v => +v.lablack1_10);
            const totalAsianLAPop1_10 = d3.sum(values, v => +v.laasian1_10);
            const totalHisLAPop1_10 = d3.sum(values, v => +v.lahisp1_10);
            const totalPopulation = d3.sum(values, v => +v.Population);
            const WhitePop = d3.sum(values, v => +v.WhitePop);
            const BlackPop = d3.sum(values, v => +v.BlackPop);
            const HispPop = d3.sum(values, v => +v.HispPop);
            const AsianPop = d3.sum(values, v => +v.AsianPop);
            const percentLAPOP1_10 = 100 * totalLAPOP1_10 / totalPopulation;
            const weightedIncomeSum = d3.sum(values, v => +v.MedianFamilyIncome * +v.Population);
            const weightedMeanIncome = weightedIncomeSum / totalPopulation;
            const percentUrbanWhite = d3.sum(values, v => +v.Urban * +v.WhitePop) /  WhitePop;
            const percentUrbanBlack = d3.sum(values, v => +v.Urban * +v.BlackPop) /  BlackPop;
            const percentUrbanAsian = d3.sum(values, v => +v.Urban * +v.AsianPop) /  AsianPop;
            const percentUrbanHisp = d3.sum(values, v => +v.Urban * +v.HispPop) /  HispPop;
            const percentUrbanAll = d3.sum(values, v => +v.Urban * +v.Population) /  totalPopulation;
            // round to 2 decimal places
            return { 
                State: state, 
                MedianFamilyIncome: Math.round(weightedMeanIncome), 
                LAPOP1_10: totalLAPOP1_10,
                WhiteLAPop1_10: totalWhiteLAPop1_10,
                BlackLAPop1_10: totalBlackLAPop1_10,
                AsianLAPop1_10: totalAsianLAPop1_10,
                HisLAPop1_10: totalHisLAPop1_10,
                TotalPopulation: totalPopulation,
                WhitePop: WhitePop,
                PercentWhitePop: 100 * totalWhiteLAPop1_10 / WhitePop,
                BlackPop: BlackPop,
                PercentBlackPop: 100 * totalBlackLAPop1_10 / BlackPop,
                AsianPop: AsianPop,
                PercentAsianPop: 100 * totalAsianLAPop1_10 / AsianPop,
                HispPop: HispPop,
                PercentHispPop: 100 * totalHisLAPop1_10 / HispPop,
                TotalPopulation: totalPopulation,
                percentLAPOP1_10: percentLAPOP1_10,
                percentUrbanAll: percentUrbanAll,
                percentUrbanWhite: percentUrbanWhite,
                percentUrbanBlack: percentUrbanBlack,
                percentUrbanAsian: percentUrbanAsian,
                percentUrbanHisp: percentUrbanHisp,
            };
        }
    );

    const transformedData = aggregatedData.flatMap(d => [
        {
            State: d.State,
            Race: "White",
            percentUrban: d.percentUrbanWhite,
            Population: d.WhiteLAPop1_10,
            PercentLAPOP1_10: d.PercentWhitePop,
            DiffPercentLAPOP1_10: d.PercentWhitePop - d.percentLAPOP1_10,
            MedianFamilyIncome: d.MedianFamilyIncome
        },
        // {
        //     State: d.State,
        //     Race: "All",
        //     percentUrban: d.percentUrbanAll,
        //     Population: d.LAPOP1_10,
        //     PercentLAPOP1_10: d.percentLAPOP1_10,
        //     DiffPercentLAPOP1_10: 0,
        //     MedianFamilyIncome: d.MedianFamilyIncome
        // },
        {
            State: d.State,
            Race: "Black",
            percentUrban: d.percentUrbanBlack,
            Population: d.BlackLAPop1_10,
            PercentLAPOP1_10: d.PercentBlackPop,
            DiffPercentLAPOP1_10: d.PercentBlackPop - d.percentLAPOP1_10,
            MedianFamilyIncome: d.MedianFamilyIncome
        },
        {
            State: d.State,
            Race: "Asian",
            percentUrban: d.percentUrbanAsian,
            Population: d.AsianLAPop1_10,
            PercentLAPOP1_10: d.PercentAsianPop,
            DiffPercentLAPOP1_10: d.PercentAsianPop - d.percentLAPOP1_10,
            MedianFamilyIncome: d.MedianFamilyIncome
        },
        {
            State: d.State,
            Race: "Hispanic",
            percentUrban: d.percentUrbanHisp,
            Population: d.HisLAPop1_10,
            PercentLAPOP1_10: d.PercentHispPop,
            DiffPercentLAPOP1_10: d.PercentHispPop - d.percentLAPOP1_10,
            MedianFamilyIncome: d.MedianFamilyIncome
        }
    ]);

    // Parse data
    const filteredTransformedData = transformedData.filter(d => d.Population > 0);
    // Scales
    // const xScale = d3.scaleLog()
    //     .domain([d3.min(filteredTransformedData, d => d.MedianFamilyIncome) - 1000, d3.max(filteredTransformedData, d => d.MedianFamilyIncome)]) // Start from 0
    //     .range([0, width]);

    const yScale = d3.scaleLinear() // Use linear scale since it starts from 0
        .domain([0, d3.max(filteredTransformedData, d => d.PercentLAPOP1_10)]) // Start from 0
        .range([height, 0]);

    const xScale = d3.scaleLinear() // Use linear scale since it starts from 0
        .domain([40, d3.max(filteredTransformedData, d => d.percentUrban) * 100]) // Start from 0
        .range([0, width]);

    const rScale = d3.scaleSqrt()
        .domain(d3.extent(filteredTransformedData, d => d.Population))
        .range([5, 20]);
    
        

    // Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(10));

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(10));

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        // .text("Median Family Income ($)");
        .text("Percent Urban (%)");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Percent Low Acess Population (%)");

    // Points
    svg.selectAll("circle")
        .data(filteredTransformedData)
        .enter()
        .append("circle")
        .attr("class", "samples")
        // .attr("cx", d => xScale(d.MedianFamilyIncome))
        .attr("cx", d => xScale(d.percentUrban * 100))
        .attr("cy", d => yScale(d.PercentLAPOP1_10))
        .attr("r", d => rScale(d.Population))
        .attr("fill", d => colorScale(d.Race))
        .attr("opacity", 0.7)
        .on("mouseover", function (event, d) {
            // Highlight all points in the same state
            if (selectedState == "all") {
                highlightState(d.State);
                updateTooltip(event, d, filteredTransformedData.filter(p => p.State == d.State && p.Race != "All"));
            } else if (d.State == selectedState){
                updateTooltip(event, d, filteredTransformedData.filter(p => p.State == d.State && p.Race != "All"));
            }

        })
        .on("mouseout", function () {
            // Reset all points to default opacity
            if (selectedState == "all") {
                d3.selectAll(".samples")
                    .transition()
                    .duration(200)
                    .attr("opacity", highOpacity)
                    .attr("stroke", null);
                if (selectedRace){highlightRace(selectedRace);}
                d3.select("#tooltip_george").style("display", "none");
            }
            });

    // Populate the dropdown menu
    const dropdown = d3.select("#state-dropdown");
    dropdown.selectAll("option")
        .data(aggregatedData.map(d => d.State))
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Add event listener for dropdown selection
    dropdown.on("change", function () {
        // Filter data based on selected state
        selectedState = this.value;
        if (selectedState != "all") {
            highlightState(selectedState);
        }
    });


    // Add legend
    const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);
    legend.append("text")
    .attr("class", "legend-title")
    .attr("x", -10)
    .attr("y", -30) // Position the title above the first legend item
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .text("Hover over each race to highlight.")
    .call(wrap, 80); // specify your desired max width in pixels

    colorScale.domain().forEach((race, i) => {
        const legendItem = legend.append("g")
            .attr("class", "legend-item")
            .attr("transform", `translate(0, ${i * legendSpacing})`) // Position each group
            .style("cursor", "pointer") // Change mouse cursor to pointer
            .on("mouseover", function () {
                console.log(d3.selectAll(`.regression-line ${race}`));
                if (!selectedRace && selectedState == "all") {
                    highlightRace(race);
                    d3.select(this).select("rect")
                        .attr("stroke", "black")
                        .attr("stroke-width", 2);
                    d3.select(this).select("text")
                        .style("font-weight", "bold");
                }
            }) // Add mouseover event
            .on("mouseout", function () {
                if (!selectedRace && selectedState == "all") {
                    resetHighlight();
                    d3.select(this).select("rect")
                        .attr("stroke", "#ccc")
                        .attr("stroke-width", 1);
                    d3.select(this).select("text")
                        .style("font-weight", "normal");
                }
            })
            .on("click", function (event) {
                // Prevent the click from propagating to the SVG
                event.stopPropagation();
                // Toggle selection
                if (selectedRace === race) {
                    resetAll();
                } else {
                    selectedRace = race;
                    highlightRace(race);
                    legend.selectAll("rect")
                        .attr("stroke", "#ccc")
                        .attr("stroke-width", 1);
                    legend.selectAll("text")
                        .style("font-weight", "normal");
                    d3.select(this).select("rect")
                        .attr("stroke", "black")
                        .attr("stroke-width", 2);
                    d3.select(this).select("text")
                        .style("font-weight", "bold");
                }         // Add mouseout event
            });

        // Bounding box
        const boundingBoxWidth = 80;
        const boundingBoxHeight = 18;

        legendItem.append("rect")
            .attr("x", -10)
            .attr("y", -boundingBoxHeight / 2)
            .attr("width", boundingBoxWidth)
            .attr("height", boundingBoxHeight)
            .attr("fill", "#f5f5f5") // Light background for the box
            .attr("stroke", "#ccc")  // Border color
            .attr("rx", 5)           // Rounded corners
            .attr("ry", 5);

        // Circle for race
        legendItem.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 5)
            .attr("fill", colorScale(race));

        // Text label for race
        legendItem.append("text")
            .attr("x", 10)
            .attr("y", -2)
            .attr("dy", "0.35em")
            .text(race)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
    });
    // Reset highlight when clicking outside
    d3.select("#scatterplot").on("click", function () {
        resetAll();
    });
    
}).catch(function(error) {
    console.error("Error loading the CSV file:", error);
});