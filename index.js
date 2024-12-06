const colors = d3.scaleSequential(d3.interpolateRdYlBu)
    .domain([-1, 1]);

    function legend({
        color,
        title,
        tickSize = 6,
        width = 350,
        height = 44 + tickSize,
        marginTop = 18,
        marginRight = 20,
        marginBottom = 16 + tickSize,
        marginLeft = 100,
        ticks = width / 64,
        tickFormat,
        tickValues
      } = {}) {
        const svg = d3.select("svg#legend")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .style("overflow", "visible")
          .style("display", "block");
      
        let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
        let x;
      
        // Continuous
        if (color.interpolate) {
          const n = Math.min(color.domain().length, color.range().length);
      
          x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));
      
          svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
        }
      
        // Sequential
        else if (color.interpolator) {
          x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
              range() {
                return [marginLeft, width - marginRight];
              }
            });
      
          svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());
      
          // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
          if (!x.ticks) {
            if (tickValues === undefined) {
              const n = Math.round(ticks + 1);
              tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
              tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
            }
          }
        }
      
        // Threshold
        else if (color.invertExtent) {
          const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
            :
            color.quantiles ? color.quantiles() // scaleQuantile
            :
            color.domain(); // scaleThreshold
      
          const thresholdFormat = tickFormat === undefined ? d => d :
            typeof tickFormat === "string" ? d3.format(tickFormat) :
            tickFormat;
      
          x = d3.scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);
      
          svg.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", d => d);
      
          tickValues = d3.range(thresholds.length);
          tickFormat = i => thresholdFormat(thresholds[i], i);
        }
      
        // Ordinal
        else {
          x = d3.scaleBand()
            .domain(color.domain())
            .rangeRound([marginLeft, width - marginRight]);
      
          svg.append("g")
            .selectAll("rect")
            .data(color.domain())
            .join("rect")
            .attr("x", x)
            .attr("y", marginTop)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", color);
      
          tickAdjust = () => {};
        }
      
        svg.append("g")
          .attr("transform", `translate(0,${height - marginBottom})`)
          .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))
          .call(tickAdjust)
          .call(g => g.select(".domain").remove())
          .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("font-size", "100%")
            .text(title));
      
        return svg.node();
      }
      
      function ramp(color, n = 256) {
        var canvas = document.createElement('canvas');
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
          context.fillStyle = color(i / (n - 1));
          context.fillRect(i, 0, 1, 1);
        }
        return canvas;
      }
      
      legend({
        color: colors,
        title: "Urban Food Desert Share - Rural Food Desert Share"
      })

let isUrban = true;
const toggleButton = d3.select("#toggleButton");

const color_urban = d3.scaleQuantize(d3.schemeBlues[6])

const margin = { top: 20, right: 30, bottom: 40, left: 40 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

var data2;
const data1 = d3.csv(
    "data/FAR_flattened.csv",
    (d) => {
        // d.Pop2010 = Number(d["Pop2010"])
        // d.Urban = Number(d["Urban"])
        d.County = d["County"]
        d.State = d["State"]
        d.lapop_5_10_diff = Number(d["lapop_5_10_diff"])
        d.tract_shorthand = d['county_code']

        d.bar_plot_data = [
            { "race": "white", "value": d["lawhite_5_10_ratio_urban"] * 100, "urban": d["lawhite_5_10_ratio_urban"] * 100, "rural": d["lawhite_5_10_ratio_rural"] * 100},
            { "race": "black", "value": d["lablack_5_10_ratio_urban"] * 100, "urban": d["lablack_5_10_ratio_urban"] * 100, "rural": d["lablack_5_10_ratio_rural"] * 100},
            { "race": "hispanic", "value": d["lahisp_5_10_ratio_urban"] * 100, "urban": d["lahisp_5_10_ratio_urban"] * 100, "rural": d["lahisp_5_10_ratio_rural"] * 100},
        ]

        return d
    }
)
    .then((d) => {
        
        
        
        toggleButton.on("click", function () {
            toggleTheButton(d)
        });


        create_map(d);
    })
function toggleTheButton(data) {
    
    isUrban = !isUrban;

    if (!isUrban) {
        toggleButton.classed("rural_on", true);
        d3.select("#toggleLabel").text("Rural");
    } else {
        toggleButton.classed("rural_on", false);
        d3.select("#toggleLabel").text("Urban");
    }
    console.log(!isUrban ? "The toggle is Rural" : "The toggle is Urban");
    data.forEach((d) => { 
        d.bar_plot_data.forEach((entry) => {
            entry["value"] = isUrban ? entry["urban"] : entry["rural"]
        })
        d3.select("#c" + d.tract_shorthand) 
            .datum(d) 
    });
    
}




function create_map(dataset) {
    d3.xml("data/Usa_counties_large.svg")
        .then(function (data) {
            console.log(data.documentElement);

            d3.select(".container")
                .node()
                .appendChild(data.documentElement)

            document.querySelectorAll('#counties').forEach(function (node) {
                // Do whatever you want with the node object.
                console.log(node)
                node.style.fill = '';
            });

            var tooltip = d3.select(".container")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "15px")

            var tooltip_margin = { top: 40, right: 30, bottom: 70, left: 30 },
                width = 150 - margin.left - margin.right,
                height = 350 - margin.top - margin.bottom;

            var svg_tooltip = tooltip.append("svg")
                .attr("width", width + tooltip_margin.left + tooltip_margin.right)
                .attr("height", height + tooltip_margin.top + tooltip_margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + tooltip_margin.left + "," + tooltip_margin.top + ")");

            var mouseover = function (event, d) {
                tooltip
                    .style("opacity", 1)
                d3.select(this)
                    .style("stroke", "blue")
                    .style("stroke-width", 1)
            }
            var mousemove = function (event, d) {
                svg_tooltip.selectAll("*").remove()
                console.log(d.bar_plot_data)
                var x = d3.scaleBand()
                    .range([0, 100])
                    .domain(d.bar_plot_data.map(function (d) { return d["race"]; }))
                    .padding(0.2);
                svg_tooltip.append("g")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end");
                var y = d3.scaleLinear()
                    .domain([0, 100])
                    .range([height, 0]);
                svg_tooltip.append("g")
                    .call(d3.axisLeft(y));
                svg_tooltip.selectAll("rect")
                    .remove()
                svg_tooltip.selectAll('rect')
                    .data(d.bar_plot_data)
                    .enter()
                    .append("rect")
                    .attr("x", function (d) { return x(d["race"]); })
                    .attr("y", function (d) { return y(Number(d["value"])); })
                    .attr("width", x.bandwidth())
                    .attr("height", function (d) {
                        console.log(d)
                        return height - y(Number(d["value"]));
                    })
                    .attr("fill", isUrban ? "lightskyblue" : "#FEDF93")

                svg_tooltip.append('text')
                    .attr('class', 'title')
                    .attr('x', width / 2)
                    .attr('y', -27)
                    .attr('text-anchor', 'middle')
                    .text("% of "  + (isUrban ? 'Urban' : 'Rural'));
                svg_tooltip.append('text')
                    .attr('class', 'title')
                    .attr('x', width / 2)
                    .attr('y', -12)
                    .attr('text-anchor', 'middle')
                    .text("LA Population");

                svg_tooltip.append('text')
                    .attr('class', 'title')
                    .attr('x', width / 2)
                    .attr('y', height + margin.bottom + 10)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '10px')
                    .text(d.County + ",");
                svg_tooltip.append('text')
                    .attr('class', 'title')
                    .attr('x', width / 2)
                    .attr('y', height + margin.bottom + 20)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '10px')
                    .text(d.State);
            }

            var mouseleave = function (event, d) {
                tooltip
                    .style("opacity", 0)
                d3.select(this)
                    .style("stroke", "black")
                    .style("stroke-width", 0.17829)
            }
            svg_tooltip.selectAll("*")
                .remove()

            dataset.forEach((d) => { 
                d3.select("#c" + d.tract_shorthand) 
                    .datum(d) 
                    .classed("region", true)
                    .attr("fill", d => {
                        console.log(d.lapop_5_10_diff)
                        var c_val = colors(d.lapop_5_10_diff)
                        return c_val
                    })
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave)
                    .on("click", (event, d) => {
                        toggleTheButton(dataset)
                        mousemove("", d)
                    })
            });
        });
}

function create_vis(data) {
    const svg = d3.select("svg");
    const tooltip = d3.select("#tooltip");

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const xScale = d3.scaleBand()
        .domain(['White', 'Black', 'Hispanic'])
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, 1]) // Assuming the ratios are between 0 and 1
        .range([height, 0]);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.Pop2010)])
        .range([5, 25]); // Circle size range

    // Append a group element for the chart
    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create dots for each data point
    var rowData = []
    data.forEach((row, i) => {
        if(Number(row['LILATracts_halfAnd10']) === 0) {
            return;
        }
        console.log(row)
        rowData = rowData.concat([
            { x: 'White', y: row.WhiteRatio, rowIndex: i, first: row.WhiteRatio, second: row.BlackRatio, third: row.HispRatio, next: row.BlackRatio, urban: row.Urban, Pop2010: row.TractWhite},
            { x: 'Black', y: row.BlackRatio, rowIndex: i, first: row.WhiteRatio, second: row.BlackRatio, third: row.HispRatio, next: row.HispRatio, urban: row.Urban, Pop2010: row.TractBlack },
            { x: 'Hispanic', y: row.HispRatio, rowIndex: i, first: row.WhiteRatio, second: row.BlackRatio, third: row.HispRatio, next: row.HispRatio, urban: row.Urban, Pop2010: row.TractHispanic }
        ]);
        console.log(rowData)
    });
    // Draw the dots
    chartGroup.selectAll("circle")
        .data(rowData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .classed("urban", d => d.urban)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", d => sizeScale(d.Pop2010))
        .on("mouseover", function (event, d) {
            // Show tooltip
            tooltip.style("visibility", "visible")
                .text(`${d.x}: ${d.y}`);
            console.log(d.x)

            // Draw lines connecting the dots
            chartGroup.selectAll(".line").remove(); // Clear existing lines

            chartGroup
                .append("line")
                .attr("class", "line")
                .classed("urban", d.urban)
                .attr("x1", xScale('White'))
                .attr("y1", yScale(d.first))
                .attr("x2", xScale('Black'))
                .attr("y2", yScale(d.second));
            chartGroup
                .append("line")
                .attr("class", "line")
                .classed("urban", d.urban)
                .attr("x1", xScale('Black'))
                .attr("y1", yScale(d.second))
                .attr("x2", xScale('Hispanic'))
                .attr("y2", yScale(d.third));
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
            chartGroup.selectAll(".line").remove();
        });
    

    // Add axis
    chartGroup.append("g")
        .selectAll("text")
        .data(xScale.domain())
        .enter()
        .append("text")
        .attr("x", d => xScale(d))
        .attr("y", height + margin.bottom)
        .attr("text-anchor", "middle")
        .text(d => d);

    chartGroup.append("g")
        .call(d3.axisLeft(yScale));
}