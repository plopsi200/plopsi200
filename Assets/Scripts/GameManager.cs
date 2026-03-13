using UnityEngine;
using System;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Core Stats")]
    public double points = 0;
    public float pointsPerClick = 1;
    public float autoClickRate = 0;
    public float baseMultiplier = 1;
    public float eventMultiplier = 1;
    public float globalMultiplier => baseMultiplier * eventMultiplier;
    public float criticalClickChance = 0; // 0 to 1
    public float criticalClickMultiplier = 10f;

    [Header("Events")]
    public Action<double> OnPointsChanged;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void AddPoints(double amount)
    {
        points += amount * globalMultiplier;
        OnPointsChanged?.Invoke(points);
    }

    public void PerformClick()
    {
        double amount = pointsPerClick;
        if (UnityEngine.Random.value < criticalClickChance)
        {
            amount *= criticalClickMultiplier;
            Debug.Log("Quantum Click!");
        }
        AddPoints(amount);
    }

    public bool TrySpendPoints(double amount)
    {
        if (points >= amount)
        {
            points -= amount;
            OnPointsChanged?.Invoke(points);
            return true;
        }
        return false;
    }

    public void AddClickPower(float amount)
    {
        pointsPerClick += amount;
    }

    public void AddAutoClickPower(float amount)
    {
        autoClickRate += amount;
    }
}
