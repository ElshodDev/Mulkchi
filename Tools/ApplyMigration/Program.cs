using Npgsql;

var connString = "Host=localhost;Database=MulkchiDb;Username=postgres;Password=smart;Port=5432";
var sql = "ALTER TABLE \"Properties\" ADD COLUMN IF NOT EXISTS \"BumpedAt\" timestamp with time zone NULL;";

await using var conn = new NpgsqlConnection(connString);
await conn.OpenAsync();

await using var cmd = new NpgsqlCommand(sql, conn);
var result = await cmd.ExecuteNonQueryAsync();
Console.WriteLine($"Executed ALTER TABLE, result: {result}");
