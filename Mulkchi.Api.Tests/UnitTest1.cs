namespace Mulkchi.Api.Tests;

/// <summary>
/// Test loyihasi smoke-testi.
/// </summary>
public class SmokeTests
{
    [Fact]
    public void TestProject_ShouldCompileAndRun()
    {
        // Arrange & Act & Assert
        true.Should().BeTrue("test loyihasi muvaffaqiyatli kompilatsiya qilinishi kerak.");
    }
}
