package com.kenostats.app

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.UUID

// Data models
data class KenoDraw(
    val id: String = UUID.randomUUID().toString(),
    val drawNumber: Int,
    val timestamp: Long = System.currentTimeMillis(),
    val numbers: List<Int>,
    val notes: String = ""
)

data class NumberStats(
    val number: Int,
    val count: Int,
    val percentage: Float,
    val gap: Int
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF6366F1),
                    secondary = Color(0xFFF59E0B),
                    background = Color(0xFF090D16),
                    surface = Color(0xFF0F172A),
                    onBackground = Color.White,
                    onSurface = Color.White
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    KenoMainScreen(context = this)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KenoMainScreen(context: Context) {
    val prefs = remember { context.getSharedPreferences("keno_prefs", Context.MODE_PRIVATE) }
    val gson = remember { Gson() }

    // Load saved draws or initialize with default sample
    var draws by remember {
        mutableStateOf(loadDraws(prefs, gson))
    }

    var selectedSpots by remember {
        mutableStateOf(setOf(7, 14, 21, 28, 35, 42, 49, 77))
    }

    var currentTab by remember { mutableStateOf(0) }
    val tabs = listOf("80 Grid", "Stats", "History", "Simulator")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Keno",
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Text(
                            text = "Stats",
                            fontWeight = FontWeight.Black,
                            color = Color(0xFFF59E0B)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Android Offline",
                            fontSize = 11.sp,
                            color = Color.Gray,
                            modifier = Modifier
                                .background(Color(0xFF1E293B), RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF090D16)
                ),
                actions = {
                    IconButton(onClick = {
                        val newDraw = generateRandomDraw(draws.size + 1001)
                        val updated = listOf(newDraw) + draws
                        draws = updated
                        saveDraws(prefs, gson, updated)
                    }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Random Draw", tint = Color(0xFF6366F1))
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF0F172A)) {
                tabs.forEachIndexed { index, title ->
                    NavigationBarItem(
                        selected = currentTab == index,
                        onClick = { currentTab = index },
                        icon = {
                            when (index) {
                                0 -> Icon(Icons.Default.Apps, contentDescription = title)
                                1 -> Icon(Icons.Default.BarChart, contentDescription = title)
                                2 -> Icon(Icons.Default.History, contentDescription = title)
                                else -> Icon(Icons.Default.Calculate, contentDescription = title)
                            }
                        },
                        label = { Text(title, fontSize = 11.sp) }
                    )
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (currentTab) {
                0 -> BoardTab(
                    draws = draws,
                    selectedSpots = selectedSpots,
                    onToggleSpot = { num ->
                        selectedSpots = if (selectedSpots.contains(num)) {
                            selectedSpots - num
                        } else {
                            if (selectedSpots.size < 15) selectedSpots + num else selectedSpots
                        }
                    },
                    onQuickPick = { count ->
                        val pool = (1..80).shuffled()
                        selectedSpots = pool.take(count).toSet()
                    },
                    onClear = { selectedSpots = emptySet() }
                )
                1 -> StatsTab(draws = draws)
                2 -> HistoryTab(
                    draws = draws,
                    selectedSpots = selectedSpots,
                    onDelete = { id ->
                        val updated = draws.filter { it.id != id }
                        draws = updated
                        saveDraws(prefs, gson, updated)
                    }
                )
                3 -> SimulatorTab(selectedSpots = selectedSpots)
            }
        }
    }
}

@Composable
fun BoardTab(
    draws: List<KenoDraw>,
    selectedSpots: Set<Int>,
    onToggleSpot: (Int) -> Unit,
    onQuickPick: (Int) -> Unit,
    onClear: () -> Unit
) {
    val counts = remember(draws) {
        val map = mutableMapOf<Int, Int>()
        (1..80).forEach { map[it] = 0 }
        draws.forEach { d ->
            d.numbers.forEach { n -> map[n] = (map[n] ?: 0) + 1 }
        }
        map
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Quick control bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Ticket: ${selectedSpots.size}/15 Spots",
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = Color.White
            )

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Button(
                    onClick = { onQuickPick(10) },
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B))
                ) {
                    Text("QP 10", fontSize = 11.sp, color = Color(0xFF38BDF8))
                }
                if (selectedSpots.isNotEmpty()) {
                    OutlinedButton(
                        onClick = onClear,
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("Clear", fontSize = 11.sp, color = Color(0xFFF87171))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 80-Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(8),
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(80) { index ->
                val num = index + 1
                val isSelected = selectedSpots.contains(num)
                val hitCount = counts[num] ?: 0

                val bg = when {
                    isSelected -> Color(0xFF6366F1)
                    hitCount >= (draws.size * 0.3) -> Color(0xFF881337)
                    hitCount <= (draws.size * 0.15) -> Color(0xFF083344)
                    else -> Color(0xFF1E293B)
                }

                Box(
                    modifier = Modifier
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(bg)
                        .border(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) Color(0xFFA5B4FC) else Color(0xFF334155),
                            shape = RoundedCornerShape(8.dp)
                        )
                        .clickable { onToggleSpot(num) },
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "$num",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = Color.White
                        )
                        Text(
                            text = "${hitCount}x",
                            fontSize = 9.sp,
                            color = Color.Gray,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatsTab(draws: List<KenoDraw>) {
    val totalDraws = draws.size
    val counts = remember(draws) {
        val map = mutableMapOf<Int, Int>()
        (1..80).forEach { map[it] = 0 }
        draws.forEach { d ->
            d.numbers.forEach { n -> map[n] = (map[n] ?: 0) + 1 }
        }
        map
    }

    val hotNumbers = remember(counts) {
        counts.entries.sortedByDescending { it.value }.take(10)
    }

    val coldNumbers = remember(counts) {
        counts.entries.sortedBy { it.value }.take(10)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Historical Overview",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Total Draws Analyzed: $totalDraws",
                        color = Color(0xFF94A3B8),
                        fontSize = 13.sp
                    )
                    Text(
                        text = "Theoretical Single Ball Probability: 25.00%",
                        color = Color(0xFF94A3B8),
                        fontSize = 13.sp
                    )
                }
            }
        }

        item {
            Text("Top 10 Hottest Numbers", fontWeight = FontWeight.Bold, color = Color(0xFFF43F5E))
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                hotNumbers.take(5).forEach { (num, count) ->
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF4C0519))
                    ) {
                        Column(
                            modifier = Modifier.padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("#$num", fontWeight = FontWeight.Bold, color = Color.White)
                            Text("${count}x", fontSize = 11.sp, color = Color(0xFFFDA4AF))
                        }
                    }
                }
            }
        }

        item {
            Text("Top 10 Coldest Numbers", fontWeight = FontWeight.Bold, color = Color(0xFF06B6D4))
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                coldNumbers.take(5).forEach { (num, count) ->
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF082F49))
                    ) {
                        Column(
                            modifier = Modifier.padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("#$num", fontWeight = FontWeight.Bold, color = Color.White)
                            Text("${count}x", fontSize = 11.sp, color = Color(0xFF67E8F9))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HistoryTab(
    draws: List<KenoDraw>,
    selectedSpots: Set<Int>,
    onDelete: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(draws) { draw ->
            val hits = draw.numbers.count { selectedSpots.contains(it) }

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Draw #${draw.drawNumber}",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        if (selectedSpots.isNotEmpty()) {
                            Text(
                                text = "$hits/${selectedSpots.size} Ticket Hits",
                                color = if (hits > 0) Color(0xFF10B981) else Color.Gray,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = draw.numbers.joinToString("  "),
                        color = Color(0xFFE2E8F0),
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

@Composable
fun SimulatorTab(selectedSpots: Set<Int>) {
    var simCount by remember { mutableStateOf(1000) }
    var resultText by remember { mutableStateOf<String?>(null) }
    val nSpots = selectedSpots.size.coerceAtLeast(1)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Hypergeometric Simulator",
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            color = Color.White
        )

        Text(
            text = "Testing with active ticket of $nSpots spots (${selectedSpots.joinToString(", ")})",
            color = Color.Gray,
            fontSize = 13.sp
        )

        Button(
            onClick = {
                val hitMap = mutableMapOf<Int, Int>()
                repeat(simCount) {
                    val drawn = (1..80).shuffled().take(20).toSet()
                    val hits = selectedSpots.count { drawn.contains(it) }
                    hitMap[hits] = (hitMap[hits] ?: 0) + 1
                }
                resultText = hitMap.toSortedMap().map { (k, v) ->
                    "$k hits: $v times (${"%.2f".format(v * 100f / simCount)}%)"
                }.joinToString("\n")
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
        ) {
            Text("Simulate $simCount Draws", fontWeight = FontWeight.Bold)
        }

        resultText?.let {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = it,
                    modifier = Modifier.padding(16.dp),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 13.sp,
                    color = Color(0xFF38BDF8)
                )
            }
        }
    }
}

// Helpers
fun generateRandomDraw(drawNumber: Int): KenoDraw {
    val nums = (1..80).shuffled().take(20).sorted()
    return KenoDraw(drawNumber = drawNumber, numbers = nums, notes = "Random draw")
}

fun saveDraws(prefs: android.content.SharedPreferences, gson: Gson, draws: List<KenoDraw>) {
    prefs.edit().putString("saved_draws", gson.toJson(draws)).apply()
}

fun loadDraws(prefs: android.content.SharedPreferences, gson: Gson): List<KenoDraw> {
    val json = prefs.getString("saved_draws", null)
    if (json != null) {
        val type = object : TypeToken<List<KenoDraw>>() {}.type
        val parsed: List<KenoDraw>? = gson.fromJson(json, type)
        if (!parsed.isNullOrEmpty()) return parsed
    }
    // Default 10 sample draws
    return (1..10).map { i ->
        KenoDraw(
            drawNumber = 1000 + i,
            numbers = (1..80).shuffled().take(20).sorted(),
            notes = "Initial sample draw #$i"
        )
    }.reversed()
}
