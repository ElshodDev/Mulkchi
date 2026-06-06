using System;
using System.Collections.Generic;
using System.Linq;

namespace Mulkchi.Api.Services.Foundations.Properties;

public partial class PropertyService
{
    // Dictionary of known correct words (Locations and Real Estate terms)
    private static readonly HashSet<string> KnownSearchDictionary = new()
    {
        // Regions & Capitals
        "toshkent", "samarqand", "buxoro", "andijon", "fargona", 
        "namangan", "qashqadaryo", "surxondaryo", "xorazm", 
        "navoiy", "jizzax", "sirdaryo", "qoraqalpogiston", "viloyati", "shahri",
        "qarshi", "termez", "urganch", "nukus", "guliston", "qoqon", "margilon",
        
        // Popular Districts (Tashkent & others)
        "chilonzor", "yunusobod", "mirobod", "mirzo", "ulugbek", "yakkasaroy",
        "olmazor", "bektemir", "uchtepa", "shayxontohur", "sergeli", "yashnobod", "tuman", "tumani",
        
        // Property Keywords
        "qulay", "arzon", "hovli", "dacha", "kvartira", "dom", 
        "ijaraga", "sotiladi", "remont", "yangi", "keng", "shinam",
        "markaz", "lyuks", "sharoit", "hovuz", "basseyn", "metro", "bekat"
    };

    /// <summary>
    /// Analyzes the user's search query and automatically corrects common typos
    /// e.g. "smarqand" -> "samarqand", "toshken" -> "toshkent"
    /// </summary>
    private string OptimizeAndCorrectSearchQuery(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return query;

        var words = query.ToLower().Split(new[] { ' ', ',', '.', '-' }, StringSplitOptions.RemoveEmptyEntries);
        var correctedWords = new List<string>();

        foreach (var word in words)
        {
            // Only correct words that are 4 characters or longer to avoid messing up short abbreviations
            if (word.Length >= 4)
            {
                var closestWord = FindClosestWordInDictionary(word);
                correctedWords.Add(closestWord);
            }
            else
            {
                correctedWords.Add(word);
            }
        }

        return string.Join(" ", correctedWords);
    }

    private string FindClosestWordInDictionary(string inputWord)
    {
        // If it's already an exact match, return it
        if (KnownSearchDictionary.Contains(inputWord))
            return inputWord;

        string bestMatch = inputWord;
        int minDistance = int.MaxValue;

        foreach (var dictWord in KnownSearchDictionary)
        {
            // Optimization: Skip words that have a huge length difference
            if (Math.Abs(dictWord.Length - inputWord.Length) > 2)
                continue;

            int distance = CalculateLevenshteinDistance(inputWord, dictWord);

            // If the distance is 1 or 2 (meaning 1 or 2 letters are wrong/missing)
            // and the word is long enough, we consider it a typo
            if (distance <= 2 && distance < minDistance)
            {
                minDistance = distance;
                bestMatch = dictWord;
            }
        }

        return bestMatch;
    }

    /// <summary>
    /// Computes the Levenshtein Distance between two strings.
    /// This represents the number of edits (insertions, deletions, substitutions) required to change one word into the other.
    /// </summary>
    private static int CalculateLevenshteinDistance(string source, string target)
    {
        if (string.IsNullOrEmpty(source)) return target?.Length ?? 0;
        if (string.IsNullOrEmpty(target)) return source?.Length ?? 0;

        int sourceLength = source.Length;
        int targetLength = target.Length;
        int[,] distanceMatrix = new int[sourceLength + 1, targetLength + 1];

        // Initialize the matrix
        for (int i = 0; i <= sourceLength; distanceMatrix[i, 0] = i++) { }
        for (int j = 0; j <= targetLength; distanceMatrix[0, j] = j++) { }

        // Calculate distance
        for (int i = 1; i <= sourceLength; i++)
        {
            for (int j = 1; j <= targetLength; j++)
            {
                int cost = (target[j - 1] == source[i - 1]) ? 0 : 1;

                distanceMatrix[i, j] = Math.Min(
                    Math.Min(distanceMatrix[i - 1, j] + 1,       // Deletion
                             distanceMatrix[i, j - 1] + 1),      // Insertion
                    distanceMatrix[i - 1, j - 1] + cost);        // Substitution
            }
        }

        return distanceMatrix[sourceLength, targetLength];
    }
}
