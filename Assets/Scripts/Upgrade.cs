using UnityEngine;

[CreateAssetMenu(fileName = "New Upgrade", menuName = "The Button/Upgrade")]
public class Upgrade : ScriptableObject
{
    public string upgradeName;
    [TextArea]
    public string description;
    public double baseCost;
    public double costMultiplier = 1.15f;

    public enum UpgradeType { PointsPerClick, AutoClickRate, ChanceX10 }
    public UpgradeType type;
    public float effectValue;

    public double GetCost(int level)
    {
        return baseCost * Mathf.Pow((float)costMultiplier, level);
    }
}
