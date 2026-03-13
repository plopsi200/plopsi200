using UnityEngine;

public class SaveSystem : MonoBehaviour
{
    private void Start()
    {
        LoadGame();
        InvokeRepeating(nameof(SaveGame), 60f, 60f); // Autosave every minute
    }

    private void OnApplicationQuit()
    {
        SaveGame();
    }

    public void SaveGame()
    {
        PlayerPrefs.SetString("Points", GameManager.Instance.points.ToString());
        PlayerPrefs.SetFloat("PointsPerClick", GameManager.Instance.pointsPerClick);
        PlayerPrefs.SetFloat("AutoClickRate", GameManager.Instance.autoClickRate);
        PlayerPrefs.SetFloat("CriticalClickChance", GameManager.Instance.criticalClickChance);

        // Save upgrade levels would require reference to UpgradeManager
        UpgradeManager upgradeManager = FindFirstObjectByType<UpgradeManager>();
        if (upgradeManager != null)
        {
            for (int i = 0; i < upgradeManager.upgrades.Count; i++)
            {
                PlayerPrefs.SetInt("Upgrade_" + i, upgradeManager.upgrades[i].currentLevel);
            }
        }

        PlayerPrefs.Save();
        Debug.Log("Game Saved");
    }

    public void LoadGame()
    {
        if (PlayerPrefs.HasKey("Points"))
        {
            GameManager.Instance.points = double.Parse(PlayerPrefs.GetString("Points"));
            GameManager.Instance.pointsPerClick = PlayerPrefs.GetFloat("PointsPerClick", 1);
            GameManager.Instance.autoClickRate = PlayerPrefs.GetFloat("AutoClickRate", 0);
            GameManager.Instance.criticalClickChance = PlayerPrefs.GetFloat("CriticalClickChance", 0);

            UpgradeManager upgradeManager = FindFirstObjectByType<UpgradeManager>();
            if (upgradeManager != null)
            {
                for (int i = 0; i < upgradeManager.upgrades.Count; i++)
                {
                    upgradeManager.upgrades[i].currentLevel = PlayerPrefs.GetInt("Upgrade_" + i, 0);
                }
                upgradeManager.RefreshAllUI();
            }

            Debug.Log("Game Loaded");
        }
    }

    [ContextMenu("Clear Save")]
    public void ClearSave()
    {
        PlayerPrefs.DeleteAll();
        Debug.Log("Save Cleared");
    }
}
